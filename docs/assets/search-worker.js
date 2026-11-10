// The demo's search worker: downloads the documentation corpus, indexes it with defuss-lexicalsearch and answers every
// search off the main thread, so typing stays smooth. It also owns the visitor's own notes index.
// Why a worker: the library's API is synchronous (ARCH.md); indexing 8 MB on the main thread would freeze the page.
// VERIFIED: scripts/site.mjs drives every message type below in Chromium.
import { LexicalSearch, codeAnalyzer, keywordAnalyzer, unicodeAnalyzer } from './lib/index.js';
import { init as initBrotli, decompressText } from './vendor/defuss-brotli/decompressor-slim.js';

const WORD = /[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu;
const FIELDS = ['body', 'description', 'title'];
const pages = new Map();
const sections = new Map();
let corpus = null;
let notes = null;
let notesAnalyzer = unicodeAnalyzer;
const noteTexts = new Map();

const post = message => postMessage(message);
const log = (tone, text) => post({ type: 'log', tone, text });
const now = () => performance.now();

/** Frontmatter title and description, the body after it, and the section folder of the path. */
const parsePage = ({ path, text }) => {
  const front = /^---\n([\s\S]*?)\n---\n/.exec(text);
  const meta = Object.fromEntries([...(front?.[1] ?? '').matchAll(/^(\w+):\s*"?(.*?)"?\s*$/gm)].map(([, key, value]) => [key, value]));
  const parts = path.split('/');
  return {
    path, section: parts.length > 2 ? parts[1] : 'overview',
    title: meta.title ?? path, description: meta.description ?? '', body: front ? text.slice(front[0].length) : text,
  };
};

/** The analyzed terms one text word yields, so highlighting matches exactly what the analyzer indexed. */
const termsOf = (analyzer, word) => analyzer.tokenize(word).map(token => {
  const normalized = (analyzer.normalize ?? (t => t.normalize('NFKC').toLowerCase()))(token);
  return analyzer.stem ? analyzer.stem(normalized) : normalized;
});

/** Character ranges of the words in `text` whose analyzed terms include one of `terms`. */
const termRanges = (text, terms, analyzer) => {
  const ranges = [];
  for (const match of text.matchAll(WORD)) {
    if (termsOf(analyzer, match[0]).some(term => terms.has(term))) ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
};

/** Every occurrence of a literal needle, optionally ignoring case. */
const literalRanges = (text, needle, caseSensitive) => {
  const haystack = caseSensitive ? text : text.toLowerCase(), probe = caseSensitive ? needle : needle.toLowerCase();
  const ranges = [];
  for (let at = haystack.indexOf(probe); at >= 0 && ranges.length < 50; at = haystack.indexOf(probe, at + Math.max(1, probe.length))) {
    ranges.push([at, at + needle.length]);
  }
  return ranges;
};

/** A window of `text` around its first range, as [text, highlighted] segments with whitespace collapsed. */
const snippet = (text, ranges, width = 240) => {
  const first = ranges[0]?.[0] ?? 0;
  let start = Math.max(0, first - Math.floor(width / 3));
  if (start > 0) start = Math.max(0, text.lastIndexOf(' ', start) + 1);
  const end = Math.min(text.length, start + width);
  const segments = [];
  let at = start;
  for (const [from, to] of ranges) {
    if (to <= start || from >= end) continue;
    if (from > at) segments.push([text.slice(at, from), false]);
    segments.push([text.slice(Math.max(from, at), Math.min(to, end)), true]);
    at = Math.min(to, end);
  }
  if (at < end) segments.push([text.slice(at, end), false]);
  return {
    before: start > 0, after: end < text.length,
    segments: segments.map(([part, mark]) => [part.replace(/\s+/g, ' '), mark]).filter(([part]) => part),
  };
};

/** Which field to excerpt and where its matches are: the body when it matched, else the description or title. */
const excerpt = (page, hit, query, options) => {
  if (options.mode !== 'lexical') {
    const field = FIELDS.find(name => hit.matches.some(match => match.field === name)) ?? 'description';
    return { field, ...snippet(page[field], literalRanges(page[field], query, options.matchCase)) };
  }
  for (const field of FIELDS) {
    const terms = new Set(hit.matches.filter(match => match.field === field).map(match => match.term));
    if (!terms.size) continue;
    const ranges = termRanges(page[field], terms, unicodeAnalyzer);
    if (ranges.length) return { field, ...snippet(page[field], ranges) };
  }
  return { field: 'description', ...snippet(page.description, []) };
};

/** Distinct query-to-term expansions of a hit, strongest first, for the result card. */
const expansions = matches => {
  const seen = new Map();
  for (const { query, term, kind, distance, field } of matches) {
    const key = `${query}\u0000${term}\u0000${kind}`;
    if (!seen.has(key)) seen.set(key, { query, term, kind, distance, fields: [] });
    seen.get(key).fields.push(field);
  }
  return [...seen.values()].slice(0, 6);
};

const searchOptions = options => {
  const opts = { limit: 12, explain: true, ranking: options.exactFirst ? 'exact-first' : 'relevance' };
  if (options.field && options.field !== 'all') opts.fields = [options.field];
  if (options.section && options.section !== 'all') opts.ids = sections.get(options.section);
  if (options.mode === 'lexical') {
    Object.assign(opts, { operator: options.all ? 'all' : 'any', prefix: options.prefix, substring: options.substring, fuzzy: options.typos, transpositions: options.typos });
  } else Object.assign(opts, { mode: options.mode, caseSensitive: options.matchCase });
  return opts;
};

const handlers = {
  async load({ manifestUrl }) {
    const started = now();
    // The decoder's WebAssembly loads while the corpus downloads; decoding waits for both. The worker fetches the bytes
    // itself: init() without an argument refuses a file:// URL in a browser, so a page opened from disk would fail.
    const decoderStarted = now();
    const wasm = fetch(new URL('./vendor/defuss-brotli/decompressor.wasm', import.meta.url)).then(response => {
      if (!response.ok && response.status !== 0) throw new Error(`Brotli decoder download failed: HTTP ${response.status}`);
      return response.arrayBuffer();
    });
    const decoder = wasm.then(bytes => initBrotli(bytes)).then(() => now() - decoderStarted);
    const manifest = await (await fetch(manifestUrl)).json();
    const response = await fetch(new URL(manifest.corpus.file, manifestUrl));
    if (!response.ok || !response.body) throw new Error(`Corpus download failed: HTTP ${response.status}`);
    const reader = response.body.getReader(), chunks = [];
    let loaded = 0, lastPost = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.byteLength;
      if (now() - lastPost > 50) { lastPost = now(); post({ type: 'progress', loaded, total: manifest.corpus.bytes }); }
    }
    post({ type: 'progress', loaded: manifest.corpus.bytes, total: manifest.corpus.bytes });
    const bytes = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const downloadMs = now() - started;
    // GitHub Pages serves the .br file as stored; a server that adds Content-Encoding: br hands over plain JSON instead.
    // Browsers offer JavaScript no Brotli decoder (DecompressionStream has none), so defuss-brotli decodes it.
    const brotli = bytes[0] !== 0x7b;
    const decoderMs = await decoder;
    const decodeStarted = now();
    const json = brotli ? decompressText(bytes) : new TextDecoder().decode(bytes);
    const decodeMs = now() - decodeStarted;
    const list = JSON.parse(json).documents.map(parsePage);
    log('info', `decoder · ${manifest.decoder.name} ${manifest.decoder.version} · ${(manifest.decoder.bytes / 1e3).toFixed(0)} kB WebAssembly and JavaScript ready in ${Math.round(decoderMs)} ms`);
    log('info', `corpus · ${list.length} pages · ${(loaded / 1e6).toFixed(2)} MB in ${Math.round(downloadMs)} ms${brotli ? ` · Brotli decoded in ${Math.round(decodeMs)} ms` : ''}`);
    phase('index');
    const indexStarted = now();
    corpus = new LexicalSearch({
      ranking: 'exact-first',
      fields: { path: { analyzer: keywordAnalyzer, weight: 4, b: 0 }, title: { weight: 3 }, description: { weight: 2 }, body: {} },
    });
    corpus.addAll(list.map(page => ({ id: page.path, fields: { path: page.path, title: page.title, description: page.description, body: page.body } })));
    const indexMs = now() - indexStarted;
    for (const page of list) {
      pages.set(page.path, page);
      if (!sections.has(page.section)) sections.set(page.section, new Set());
      sections.get(page.section).add(page.path);
    }
    const stats = corpus.stats();
    log('success', `indexed · ${stats.documents} pages · ${stats.terms.toLocaleString('en')} terms · ${Math.round(indexMs)} ms`);
    post({
      type: 'indexed', manifest, downloadMs, indexMs, stats,
      tokens: Object.values(stats.fields).reduce((n, field) => n + field.tokens, 0),
      pages: list.map(({ path, title, section }) => ({ id: path, title, section })),
      sections: [...sections].map(([name, ids]) => ({ name, pages: ids.size })).sort((a, b) => a.name.localeCompare(b.name)),
    });
    bench();
  },

  search({ id, index, query, options }) {
    if (index === 'notes') return searchNotes(id, query);
    const started = now();
    let response;
    try { response = corpus.searchWithStats(query, searchOptions(options)); }
    catch (error) { post({ type: 'results', id, index, query, error: error.message }); return; }
    const ms = now() - started;
    const hits = response.hits.map(hit => {
      const page = pages.get(hit.id);
      return {
        id: hit.id, rank: hit.rank, score: hit.score, tier: hit.tier, title: page.title, section: page.section,
        pathMatched: hit.matches.some(match => match.field === 'path'), excerpt: excerpt(page, hit, query, options), expansions: expansions(hit.matches),
      };
    });
    post({ type: 'results', id, index, query, total: response.total, size: corpus.size, stats: response.stats, ms, hits });
  },

  /** A random word that occurs in exactly one page body: the needle; that page is the gold answer. */
  needle() {
    const ids = [...pages.keys()];
    for (let attempt = 0; attempt < 40; attempt++) {
      const id = ids[Math.floor(Math.random() * ids.length)];
      const words = [...new Set((pages.get(id).body.match(/\p{L}{6,}/gu) ?? []).map(word => word.toLowerCase()))];
      for (let i = words.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [words[i], words[j]] = [words[j], words[i]]; }
      for (const word of words.slice(0, 120)) {
        if (corpus.searchWithStats(word, { fields: ['body'], limit: 0 }).total === 1) {
          post({ type: 'needle', word, id, title: pages.get(id).title });
          return;
        }
      }
    }
    post({ type: 'needle', word: null });
  },

  async 'notes-analyzer'({ analyzer }) {
    // Language analyzers load on demand, one module per language; the select in index.html lists the 20 codes.
    const builtin = { unicode: unicodeAnalyzer, code: codeAnalyzer };
    if (!Object.hasOwn(builtin, analyzer) && !/^[a-z]{2}$/.test(analyzer)) throw new Error(`Unknown analyzer ${analyzer}`);
    notesAnalyzer = builtin[analyzer] ?? (await import(`./lib/${analyzer}.js`)).default;
    notes = new LexicalSearch({ analyzer: notesAnalyzer });
    const started = now();
    for (const [id, text] of noteTexts) notes.upsert({ id, fields: { text } });
    post({ type: 'notes-ready', analyzer, id: notesAnalyzer.id, notes: notes.size, ms: now() - started });
  },

  note({ id, text }) {
    const started = now();
    try {
      if (!text.trim()) {
        noteTexts.delete(id);
        notes.remove(id);
        post({ type: 'note', id, state: 'removed', size: notes.size });
        return;
      }
      notes.upsert({ id, fields: { text } });
      noteTexts.set(id, text);
      post({ type: 'note', id, state: 'indexed', ms: now() - started, size: notes.size });
    } catch (error) {
      post({ type: 'note', id, state: 'failed', message: error.message, size: notes.size });
    }
  },
};

const phase = name => post({ type: 'phase', phase: name });

const searchNotes = (id, query) => {
  const started = now();
  let response;
  try { response = notes.searchWithStats(query, { limit: 12, explain: true, prefix: true, substring: true, fuzzy: true, transpositions: true }); }
  catch (error) { post({ type: 'results', id, index: 'notes', query, error: error.message }); return; }
  const ms = now() - started;
  const hits = response.hits.map(hit => {
    const text = noteTexts.get(hit.id);
    const ranges = termRanges(text, new Set(hit.matches.map(match => match.term)), notesAnalyzer);
    return { id: hit.id, rank: hit.rank, score: hit.score, excerpt: { field: 'text', ...snippet(text, ranges, 400) }, expansions: expansions(hit.matches) };
  });
  post({ type: 'results', id, index: 'notes', query, total: response.total, size: notes.size, stats: response.stats, ms, hits });
};

/** Median latency of representative queries on this device, measured right after indexing. */
const bench = () => {
  const cases = [
    ['Rare word', 'backface', { fields: ['body'] }],
    ['Common word', 'component', {}],
    ['Phrase', '"dark mode"', {}],
    ['Completion', 'scaff', { prefix: true }],
    ['Typo', 'dialgo', { fuzzy: true, transpositions: true }],
    ['Inside words', 'board', { substring: true }],
    ['Literal substring', 'aria-label', { mode: 'substring' }],
  ];
  const rows = cases.map(([label, query, options]) => {
    const opts = { ...options, limit: 12 };
    let started = now();
    corpus.search(query, opts);
    const firstMs = now() - started;
    // Browsers coarsen performance.now() to 0.1 ms without cross-origin isolation, so each sample times a batch of
    // searches that lasts about 2 ms and divides; the warm-up runs size the batch.
    started = now();
    for (let i = 0; i < 3; i++) corpus.search(query, opts);
    const batch = Math.min(5000, Math.max(1, Math.ceil(2 / Math.max((now() - started) / 3, 0.001))));
    const times = [];
    for (let i = 0; i < 21; i++) {
      started = now();
      for (let j = 0; j < batch; j++) corpus.search(query, opts);
      times.push((now() - started) / batch);
    }
    times.sort((a, b) => a - b);
    return { label, query, options, firstMs, p50: times[10], total: corpus.searchWithStats(query, { ...opts, limit: 0 }).total };
  });
  log('success', `benchmark · ${rows.length} queries · median of 21 timed batches each`);
  post({ type: 'bench', rows });
};

self.onmessage = async ({ data }) => {
  try { await handlers[data.type](data); }
  catch (error) { post({ type: 'error', request: data.type, message: error.message }); }
};
handlers['notes-analyzer']({ analyzer: 'unicode' });
