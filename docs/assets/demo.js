// The demo's glue: worker events to defuss-shadcn State APIs, user input to worker requests. The worker owns both
// indexes (search-worker.js); search-view.js runs a search panel, notes.js the notes board, render.js builds markup.
// Why plain ES modules driving component State APIs instead of a framework app: GitHub Pages serves docs/ as static files
// without a build step, and every visual state is a documented component state the e2e can read back.
// VERIFIED: scripts/site.mjs checks every manifest figure this file writes against data/manifest.json.
import { createNotesBoard } from './notes.js';
import { formatMs, kb, mb, plural, renderBenchRows, renderHits, renderLogLine, renderNoteHits, renderPageGroups, renderSectionOptions } from './render.js';
import { createSearchView } from './search-view.js';

const SOURCE_BASE = 'https://github.com/kyr0/defuss-shadcn/blob/896cf2ac69c53317e669604f2c28d524d947c10a/src/documentation';
const DOWNLOAD_WEIGHT = 0.7;
const $ = id => document.getElementById(id);
const el = {
  ring: $('ring'), corpus: $('p-corpus'), index: $('p-index'), status: $('boot-status'), log: $('log'),
  cmd: $('cmd'), cmdList: $('cmd-list'), error: $('boot-error'), theme: $('theme-toggle'), tabs: $('demo-tabs'),
  query: document.querySelector('#panel-docs .ls-query'), mode: $('mode'), field: $('opt-field'), section: $('opt-section'),
};
const cmdInput = el.cmd.querySelector('.command-input');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const worker = new Worker(new URL('./search-worker.js', import.meta.url), { type: 'module' });
const manifestUrl = new URL('../data/manifest.json', import.meta.url).href;

const state = { phase: 'loading', pages: new Map(), gold: null, needle: null };
const isReady = () => state.phase === 'ready';
const setStat = (name, text) => { document.querySelector(`[data-stat="${name}"]`).textContent = text; };

// ---- manifest figures: the page is written with the current numbers, the manifest keeps them honest ----------------
const applyManifest = ({ version, library, corpus }) => {
  for (const id of ['hero-version', 'header-version', 'menu-version', 'use-version']) $(id).textContent = `v${version}`;
  $('hero-size').textContent = `in ${kb(library.coreGzipBytes)} of gzipped JavaScript`;
  $('intro-size').textContent = kb(library.coreGzipBytes);
  $('demo-pages').textContent = corpus.pages.toLocaleString('en');
  $('demo-text').textContent = mb(corpus.textBytes);
  document.querySelector('output[for="p-corpus"]').dataset.template = `{percent} of ${kb(corpus.bytes)} (Brotli)`;
  el.corpus.max = corpus.bytes;
};

// ---- boot: bars, ring and log -----------------------------------------------------------------------------------------
const ring = value => el.ring.api.setState('default', { value: Math.min(100, Math.round(value * 100)) });
const caption = text => { el.ring.querySelector('.radial-progress-caption').textContent = text; };
const log = (tone, text) => {
  for (const line of el.log.querySelectorAll('pre[data-cursor]')) line.removeAttribute('data-cursor');
  el.log.insertAdjacentHTML('beforeend', renderLogLine(tone, text));
  while (el.log.children.length > 80) el.log.firstElementChild.remove();
  el.log.scrollTop = el.log.scrollHeight;
};
const boot = () => {
  state.phase = 'loading';
  el.error.hidden = true;
  el.status.textContent = 'Downloading the documentation corpus...';
  caption('corpus');
  for (const bar of [el.corpus, el.index]) { bar.removeAttribute('data-tone'); bar.api.setState('default', { value: 0 }); }
  el.ring.removeAttribute('data-tone');
  ring(0);
  worker.postMessage({ type: 'load', manifestUrl });
};

// ---- search options of the documentation panel ------------------------------------------------------------------------
const checked = id => $(id).checked;
const mode = () => el.mode.querySelector('[aria-pressed="true"]')?.dataset.mode ?? 'lexical';
const docsOptions = () => ({
  mode: mode(), prefix: checked('opt-prefix'), typos: checked('opt-typos'), substring: checked('opt-substring'), all: checked('opt-all'),
  exactFirst: checked('opt-exact-first'), matchCase: checked('opt-case'), field: el.field.value, section: el.section.value,
});
/** Ranked search has word options, literal modes have case: each switch is enabled only where it has an effect. */
const syncSwitches = () => {
  const lexical = mode() === 'lexical';
  for (const item of document.querySelectorAll('[data-lexical] .switch')) item.disabled = !lexical;
  for (const item of document.querySelectorAll('[data-literal] .switch')) item.disabled = lexical;
};

const goldNote = data => {
  if (!state.gold || state.gold.query !== data.query) return '';
  const rank = data.hits.findIndex(hit => hit.id === state.gold.id) + 1;
  return rank ? `${state.gold.label} at #${rank}` : `${state.gold.label} not in the top ${data.hits.length}`;
};

const views = {
  docs: createSearchView({
    index: 'docs', root: $('panel-docs'), worker, isReady, options: docsOptions,
    onInput: text => { if (state.gold && state.gold.query !== text) state.gold = null; }, // edited: no longer the pick
    render: data => renderHits(data.hits, { gold: state.gold?.query === data.query ? state.gold.id : null, sourceBase: SOURCE_BASE }),
    count: data => `${data.hits.length} of ${plural(data.total, 'page')}`,
    note: goldNote,
    onShown: data => {
      setStat('query', formatMs(data.ms));
      setStat('work', `${plural(data.stats.postingsVisited, 'posting')} visited`);
    },
  }),
  notes: createSearchView({
    index: 'notes', root: $('notes-search'), worker, isReady: () => true,
    render: data => renderNoteHits(data.hits, board.labels),
    count: data => `${data.hits.length} of ${plural(data.size, 'note')}`,
  }),
};
const board = createNotesBoard({ list: $('notes'), empty: $('notes-empty'), count: $('notes-count'), worker, onChange: () => views.notes.refresh() });

// The toggle group flips aria-pressed without a change event, so its state is observed.
new MutationObserver(() => { syncSwitches(); views.docs.refresh(); }).observe(el.mode, { subtree: true, attributeFilter: ['aria-pressed'] });
for (const control of document.querySelectorAll('#controls .switch, #controls .select')) control.addEventListener('change', () => views.docs.refresh());
syncSwitches();

/** Documentation searches always run in the first tab; a pick made from the second tab switches back. */
const showDocsTab = () => { if (el.tabs.api.getState().config.index !== 0) el.tabs.api.setState('active', { index: 0 }); };
/** Keeps the scroll position: only a query row out of view is brought back, so the results stay in sight. */
const reveal = () => {
  const { top, bottom } = el.query.getBoundingClientRect();
  if (top < 0 || bottom > innerHeight) el.query.scrollIntoView({ block: 'start', behavior: motion.matches ? 'auto' : 'smooth' });
};
const setMode = name => {
  for (const button of el.mode.querySelectorAll('.toggle')) button.setAttribute('aria-pressed', String(button.dataset.mode === name));
  syncSwitches();
};
/** A pick, an example or a needle searches everything: a field or section filter must not hide its page. */
const clearFilters = () => { el.field.value = el.section.value = 'all'; };
const askDocs = (text, gold = null) => {
  showDocsTab();
  state.gold = gold;
  views.docs.ask(text);
  reveal();
};

// Each example shows one kind of match, with the options that kind needs.
const EXAMPLES = {
  term: ['dialog', 'lexical'], phrase: ['"dark mode"', 'lexical'], typo: ['dialgo', 'lexical'], completion: ['scaff', 'lexical'],
  literal: ['aria-label', 'substring'], path: ['pages/overlays/command.mdx', 'lexical'],
};
$('examples').addEventListener('click', event => {
  const button = event.target.closest('[data-example]');
  if (!button) return;
  const [query, name] = EXAMPLES[button.dataset.example];
  setMode(name);
  clearFilters();
  if (name === 'lexical') for (const id of ['opt-prefix', 'opt-typos']) $(id).checked = true;
  askDocs(query);
});

const hideNeedle = () => {
  if (!isReady()) return;
  for (const button of document.querySelectorAll('#needle-button, [data-needle]')) button.disabled = true;
  worker.postMessage({ type: 'needle' });
};
for (const button of document.querySelectorAll('#needle-button, [data-needle]')) button.addEventListener('click', hideNeedle);

// "My data (custom)" links in the copy open that tab and bring the tab bar into view.
for (const link of document.querySelectorAll('[data-tab]')) {
  link.addEventListener('click', () => {
    el.tabs.api.setState('active', { index: Number(link.dataset.tab) });
    el.tabs.scrollIntoView({ block: 'start', behavior: motion.matches ? 'auto' : 'smooth' });
  });
}
$('add-note').addEventListener('click', () => board.add());
$('add-samples').addEventListener('click', () => board.addSamples(5));
$('notes-analyzer').addEventListener('change', event => worker.postMessage({ type: 'notes-analyzer', analyzer: event.target.value }));

// ---- worker events ----------------------------------------------------------------------------------------------------
const handlers = {
  progress: ({ loaded, total }) => {
    el.corpus.api.setState('default', { value: loaded, max: total });
    ring(DOWNLOAD_WEIGHT * loaded / total);
  },
  phase: ({ phase }) => {
    if (phase !== 'index') return;
    el.corpus.api.setState('complete');
    el.corpus.dataset.tone = 'success';
    el.index.api.setState('indeterminate');
    el.index.toggleAttribute('data-striped', true);
    el.status.textContent = 'Indexing every page in a Web Worker...';
    caption('index');
    ring(DOWNLOAD_WEIGHT);
  },
  log: ({ tone, text }) => log(tone, text),
  indexed: data => {
    state.phase = 'ready';
    applyManifest(data.manifest);
    for (const page of data.pages) state.pages.set(page.id, page);
    el.index.toggleAttribute('data-striped', false);
    el.index.api.setState('complete');
    el.index.dataset.tone = 'success';
    el.ring.api.setState('complete');
    el.ring.dataset.tone = 'success';
    caption('ready');
    const total = data.downloadMs + data.indexMs;
    el.status.textContent = `Ready in ${(total / 1000).toFixed(1)} s · ${data.stats.documents} pages indexed in your browser.`;
    setStat('pages', data.stats.documents.toLocaleString('en'));
    setStat('tokens', `${data.tokens.toLocaleString('en')} tokens indexed`);
    setStat('terms', data.stats.terms.toLocaleString('en'));
    setStat('indexed', formatMs(data.indexMs));
    setStat('download', `after ${formatMs(data.downloadMs)} download and unpack`);
    document.querySelector('[data-bench="download"]').textContent = formatMs(data.downloadMs);
    document.querySelector('[data-bench="index"]').textContent = formatMs(data.indexMs);
    $('cmd-placeholder').outerHTML = renderPageGroups(data.pages, data.sections);
    el.section.innerHTML = renderSectionOptions(data.sections);
    for (const button of document.querySelectorAll('#needle-button, [data-needle]')) button.disabled = false;
    views.docs.resume();
  },
  bench: ({ rows }) => {
    $('bench-rows').innerHTML = renderBenchRows(rows);
    const p50 = label => formatMs(rows.find(row => row.label === label).p50);
    document.querySelector('[data-bench="rare"]').textContent = p50('Rare word');
    document.querySelector('[data-bench="typo"]').textContent = p50('Typo');
  },
  needle: ({ word, id, title }) => {
    for (const button of document.querySelectorAll('#needle-button, [data-needle]')) button.disabled = false;
    if (!word) { log('warning', 'needle · no page-unique word found this time, try again'); return; }
    log('info', `needle · "${word}" occurs only in ${id}`);
    setMode('lexical');
    clearFilters();
    askDocs(word, { query: word, id, label: `Needle page "${title}"` });
  },
  'notes-ready': data => {
    log('success', `notes · analyzer ${data.id} · ${data.notes} notes in ${formatMs(data.ms)}`);
    board.onRebuilt(data);
  },
  note: data => board.onNote(data),
  results: data => views[data.index].onResults(data),
  error: ({ message, request }) => {
    const loading = request === 'load' || state.phase === 'loading';
    if (loading) {
      state.phase = 'error';
      el.status.textContent = 'Loading failed.';
      el.index.toggleAttribute('data-striped', false);
      el.ring.dataset.tone = 'destructive';
      for (const view of Object.values(views)) view.onError();
    }
    if (request === 'needle') for (const button of document.querySelectorAll('#needle-button, [data-needle]')) button.disabled = false;
    $('boot-error-title').textContent = loading ? 'Loading failed' : 'Request failed';
    $('boot-error-text').textContent = message;
    el.error.hidden = false;
    log('destructive', message);
  },
};
worker.onmessage = ({ data }) => handlers[data.type]?.(data);
worker.onerror = event => handlers.error({ request: 'load', message: event.message || 'The search worker failed to start' });
$('boot-retry').addEventListener('click', () => (state.phase === 'error' ? boot() : (el.error.hidden = true)));

// ---- palette, theme, copy -------------------------------------------------------------------------------------------
// Picking a page searches its title and marks that page, so the result shows where exact-first ranking puts it.
el.cmdList.addEventListener('click', event => {
  const item = event.target.closest('.command-item[data-page]');
  if (!item) return;
  const page = state.pages.get(item.dataset.page);
  setMode('lexical');
  clearFilters();
  askDocs(page.title, { query: page.title, id: page.id, label: 'Picked page' });
});
// The palette activates its highlighted item on Enter; with no item left, Enter searches the typed text.
cmdInput.addEventListener('keydown', event => {
  const text = cmdInput.value.trim();
  if (event.key !== 'Enter' || !text || el.cmdList.querySelector(".command-item:not([hidden]):not([aria-disabled='true'])")) return;
  el.cmd.api.setState('default');
  askDocs(text);
});

const setTheme = dark => {
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  el.theme.checked = dark;
  try { localStorage.setItem('defuss-shadcn-theme', JSON.stringify(dark ? 'dark' : 'light')); } catch {}
};
el.theme.checked = document.documentElement.classList.contains('dark');
el.theme.addEventListener('change', () => setTheme(el.theme.checked));

const copyText = async (text, status, label) => {
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = 'Copied';
  } catch {
    status.textContent = 'Copy failed';
  }
  if (!label) return;
  label.textContent = status.textContent;
  setTimeout(() => { label.textContent = 'Copy prompt'; }, 2000);
};
document.querySelector('.mk-code-block-copy').addEventListener('click', () =>
  copyText(document.querySelector('#usage-code').innerText, document.querySelector('.mk-code-block-status')));
$('copy-prompt').addEventListener('click', () => copyText(
  [...document.querySelectorAll('#agent-prompt pre:not([data-tone]) code')].map(code => code.textContent).join('\n'),
  $('copy-prompt-status'), $('copy-prompt').querySelector('span')));

for (const button of document.querySelectorAll('#needle-button, [data-needle]')) button.disabled = true;
// The first load starts from the markup's initial states; boot() resets them for a retry.
worker.postMessage({ type: 'load', manifestUrl });
