import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { LexicalSearch, keywordAnalyzer } from '../dist/index.js';

// Haystack: 410 MDX pages (8 MB) of defuss-shadcn documentation at one commit, the same file the website demo searches;
// it carries its source URL and MIT license. Rebuild it with scripts/haystack-fixture.mjs.
const fixture = JSON.parse(brotliDecompressSync(readFileSync(new URL('../docs/data/defuss-shadcn-docs.json.br', import.meta.url))));
const page = ({ path, text }) => {
  const front = /^---\n([\s\S]*?)\n---\n/.exec(text);
  const meta = Object.fromEntries([...(front?.[1] ?? '').matchAll(/^(\w+):\s*"?(.*?)"?\s*$/gm)].map(([, key, value]) => [key, value]));
  return { id: path, fields: { path, title: meta.title ?? '', description: meta.description ?? '', body: front ? text.slice(front[0].length) : text } };
};
const pages = fixture.documents.map(page);
const options = { ranking: 'exact-first', fields: {
  path: { analyzer: keywordAnalyzer, weight: 4, b: 0 }, title: { weight: 3 }, description: { weight: 2 }, body: {},
} };
const build = () => { const index = new LexicalSearch(options); index.addAll(pages); return index; };
const index = build();
const sorted = hits => hits.map(hit => hit.id).sort();

// Oracle: the documented default analysis (NFKC, lowercase Unicode words), computed by scanning, without any index.
const words = text => (text.normalize('NFKC').match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu) ?? []).map(word => word.toLowerCase());
const bodies = pages.map(({ id, fields }) => {
  const list = words(fields.body);
  return { id, text: fields.body, words: list, set: new Set(list), joined: ` ${list.join(' ')} ` };
});
const df = new Map();
for (const body of bodies) for (const word of body.set) df.set(word, (df.get(word) ?? 0) + 1);
const levenshtein = (a, b) => {
  [a, b] = [Array.from(a), Array.from(b)];
  let row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length];
};
// One deterministic sequence per test, so samples do not depend on which tests ran before.
const sampler = seed => n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };

test('the haystack fixture holds every documentation page with frontmatter', () => {
  assert.equal(pages.length, 410);
  assert.equal(index.size, pages.length);
  assert.ok(pages.every(({ fields }) => fields.title && fields.body));
  assert.match(fixture.license, /^MIT License/);
});
test('a word unique to one page finds exactly that page and visits one posting', () => {
  let checked = 0;
  for (const body of bodies) {
    const needle = [...body.set].filter(word => df.get(word) === 1 && /^\p{L}{5,}$/u.test(word)).sort()[0];
    if (!needle) continue;
    const response = index.searchWithStats(needle, { fields: ['body'] });
    assert.deepEqual(response.hits.map(hit => hit.id), [body.id], needle);
    assert.equal(response.stats.postingsVisited, 1, needle);
    checked++;
  }
  assert.ok(checked > pages.length / 2, `only ${checked} pages have a unique word`);
});
test('literal substring needles return exactly the pages that contain them', () => {
  const rand = sampler(1);
  for (let i = 0; i < 60; i++) {
    const body = bodies[rand(bodies.length)], length = 8 + rand(33), start = rand(Math.max(1, body.text.length - length));
    const needle = body.text.slice(start, start + length);
    const expected = bodies.filter(other => other.text.includes(needle)).map(other => other.id).sort();
    assert.deepEqual(sorted(index.search(needle, { mode: 'substring', fields: ['body'], limit: 1000 })), expected, JSON.stringify(needle));
  }
});
test('quoted phrases return exactly the pages with that contiguous word sequence', () => {
  const rand = sampler(2);
  for (let i = 0; i < 40; i++) {
    const body = bodies[rand(bodies.length)], n = 2 + rand(4);
    if (body.words.length <= n) continue;
    const start = rand(body.words.length - n), phrase = body.words.slice(start, start + n).join(' ');
    const expected = bodies.filter(other => other.joined.includes(` ${phrase} `)).map(other => other.id).sort();
    assert.deepEqual(sorted(index.search(`"${phrase}"`, { fields: ['body'], limit: 1000 })), expected, phrase);
  }
});
test('substring and typo expansion over the whole vocabulary equal scan oracles', () => {
  const rand = sampler(3), vocabulary = [...df.keys()], letters = vocabulary.filter(word => /^\p{L}{6,}$/u.test(word));
  const pagesWith = matches => {
    const terms = vocabulary.filter(matches);
    return bodies.filter(body => terms.some(term => body.set.has(term))).map(body => body.id).sort();
  };
  for (let i = 0; i < 30; i++) {
    const word = vocabulary[rand(vocabulary.length)], length = Math.min(Array.from(word).length, 3 + rand(4));
    const needle = Array.from(word).slice(0, length).join('');
    assert.deepEqual(sorted(index.search(needle, { substring: true, fields: ['body'], limit: 1000 })), pagesWith(other => other.includes(needle)), needle);
  }
  for (let i = 0; i < 15; i++) {
    const word = letters[rand(letters.length)], at = rand(word.length);
    const typo = word.slice(0, at) + (word[at] === 'x' ? 'q' : 'x') + word.slice(at + 1);
    assert.deepEqual(sorted(index.search(typo, { fuzzy: 1, fields: ['body'], limit: 1000 })), pagesWith(other => levenshtein(typo, other) <= 1), typo);
  }
});
test('every page path and title ranks its own page first in the literal tier', () => {
  for (const { fields } of pages) {
    const [byPath] = index.search(fields.path);
    assert.deepEqual([byPath.id, byPath.tier], [fields.path, 'literal']);
    if (/["\\]/.test(fields.title)) continue;
    const [byTitle] = index.search(fields.title);
    assert.deepEqual([index.get(byTitle.id).fields.title, byTitle.tier], [fields.title, 'literal'], fields.title);
  }
});
test('a needle planted in the largest page is found by term, phrase, prefix, typo and literal, then fully removed', () => {
  const sentence = 'The zephyrine quokka marmalizes a hyperbolic samovar.';
  for (const word of ['zephyrine', 'quokka', 'marmalizes', 'samovar']) assert.equal(df.has(word), false, `${word} must not occur in the haystack`);
  assert.ok([...df.keys()].every(word => !word.startsWith('zephyr')));
  const largest = pages.reduce((a, b) => (b.fields.body.length > a.fields.body.length ? b : a));
  const body = largest.fields.body, middle = body.indexOf('\n', body.length >> 1);
  const haystack = build();
  haystack.upsert({ ...largest, fields: { ...largest.fields, body: `${body.slice(0, middle)}\n${sentence}${body.slice(middle)}` } });

  assert.deepEqual(haystack.search('samovar').map(hit => [hit.id, hit.tier]), [[largest.id, 'term']]);
  assert.deepEqual(sorted(haystack.search('"zephyrine quokka marmalizes"')), [largest.id]);
  assert.deepEqual(haystack.search('"quokka zephyrine"'), []);
  assert.deepEqual(sorted(haystack.search('zephyr', { prefix: true })), [largest.id]);
  const [typo] = haystack.search('qoukka', { fuzzy: 1, transpositions: true, explain: true });
  assert.deepEqual([typo.id, typo.matches[0].term, typo.matches[0].distance], [largest.id, 'quokka', 1]);
  assert.deepEqual(sorted(haystack.search('hyperbolic samovar.', { mode: 'substring', fields: ['body'] })), [largest.id]);

  haystack.upsert(largest);
  assert.deepEqual(haystack.search('samovar'), []);
  assert.deepEqual(haystack.search('zephyr', { prefix: true }), []);
  assert.deepEqual(haystack.stats(), index.stats());
});
test('a restored snapshot answers needle queries identically', () => {
  const restored = LexicalSearch.fromJSON(index.serialize());
  for (const [query, options] of [['backface', { fields: ['body'] }], ['"for example"', { limit: 50 }], ['aria-label', { mode: 'substring', limit: 1000 }],
    ['dialgo', { fuzzy: 1, transpositions: true, limit: 20 }], ['scaff', { prefix: true, limit: 20 }]]) {
    const expected = index.search(query, options);
    assert.ok(expected.length, query);
    assert.deepEqual(restored.search(query, options), expected, query);
  }
});
