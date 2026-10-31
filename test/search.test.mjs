import test from 'node:test';
import assert from 'node:assert/strict';
import { LexicalSearch, codeAnalyzer, createAnalyzer } from '../dist/index.js';
import en from '../dist/en.js';
import de from '../dist/de.js';
import fr from '../dist/fr.js';
import es from '../dist/es.js';
import ja from '../dist/ja.js';
import { createRequire } from 'node:module';

const doc = (id, text, metadata) => ({ id, fields: { text }, ...(metadata === undefined ? {} : { metadata }) });
const ids = hits => hits.map(hit => hit.id);
const make = (...docs) => { const index = new LexicalSearch(); index.addAll(docs); return index; };
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test('BM25 counts distinct documents; repeated tokens never produce NaN', () => {
  const index = make(doc('x', 'x x'));
  const [hit] = index.search('x');
  close(hit.score, Math.log(1 + .5 / 1.5) * 2 * 2.2 / (2 + 1.2));
  assert.equal(hit.rank, 1);
});
test('hand-calculated BM25 with mixed document lengths', () => {
  const index = make(doc('a', 'rare rare common'), doc('b', 'common'));
  const [hit] = index.search('rare');
  close(hit.score, Math.log(2) * 4.4 / (2 + 1.2 * (.25 + .75 * 3 / 2)));
});
test('all-corpus terms have finite positive scores', () => {
  const index = make(doc('a', 'common'), doc('b', 'common common'));
  assert.ok(index.search('common').every(hit => Number.isFinite(hit.score) && hit.score > 0));
});
test('empty corpus, empty document, empty query and unknown terms', () => {
  const index = make(doc('empty', ''));
  for (const query of ['', '!!!', 'missing']) assert.deepEqual(index.search(query), []);
  assert.deepEqual(index.stats().fields.text, { documents: 0, tokens: 0, averageLength: 0 });
});
test('caller IDs avoid known Aa/BB hash collision and preserve identical documents', () => {
  const index = make(doc('Aa', 'same text'), doc('BB', 'same text'));
  assert.deepEqual(ids(index.search('same')), ['Aa', 'BB']);
});
test('prototype-like IDs and terms are safe', () => {
  const index = make(doc('__proto__', 'constructor prototype'), doc('constructor', 'prototype'));
  assert.equal(index.search('constructor')[0].id, '__proto__');
  assert.equal(index.search('prototype').length, 2);
});
test('duplicate document IDs fail instead of silently overwriting', () => {
  const index = make(doc('a', 'old'));
  assert.throws(() => index.add(doc('a', 'new')), /Duplicate/);
  assert.deepEqual(ids(index.search('old')), ['a']);
});
test('batch validation is atomic for duplicates and invalid fields', () => {
  const index = make(doc('a', 'old'));
  assert.throws(() => index.addAll([doc('b', 'new'), doc('b', 'duplicate')]), /Duplicate/);
  assert.throws(() => index.addAll([doc('b', 'new'), { id: 'c', fields: { wrong: 'x' } }]), /Unknown field/);
  assert.equal(index.size, 1); assert.deepEqual(index.search('new'), []);
});
test('failed upsert retains previous document, postings, statistics and metadata', () => {
  const index = make(doc('a', 'old old', { revision: 1 }));
  const before = index.serialize();
  assert.throws(() => index.upsert({ id: 'a', fields: { text: 42 } }), /string/);
  assert.equal(index.serialize(), before);
});
test('upsert replaces all lexical and metadata state', () => {
  const index = make(doc('a', 'obsolete obsolete', { revision: 1 }));
  index.upsert(doc('a', 'replacement', { revision: 2 }));
  assert.deepEqual(index.search('obsolete', { fuzzy: 2, prefix: true }), []);
  assert.equal(index.search('replacement')[0].metadata.revision, 2);
  assert.equal(index.stats().fields.text.tokens, 1);
});
test('deletion updates N, DF and average length', () => {
  const index = make(doc('a', 'rare rare long document'), doc('b', 'rare'));
  assert.equal(index.remove('a'), true);
  assert.equal(index.remove('a'), false);
  const fresh = make(doc('b', 'rare'));
  assert.deepEqual(index.search('rare'), fresh.search('rare'));
  assert.deepEqual(index.stats(), fresh.stats());
});
test('removing trie terminal retains longer descendants', () => {
  const index = make(doc('a', 'car'), doc('b', 'cart'), doc('c', 'carpet'));
  index.remove('a');
  assert.deepEqual(ids(index.search('car', { prefix: true })), ['b', 'c']);
  assert.deepEqual(index.search('car'), []);
});
test('removing trie descendant retains terminal prefix', () => {
  const index = make(doc('a', 'car'), doc('b', 'cart'));
  index.remove('b'); assert.deepEqual(ids(index.search('car', { prefix: true })), ['a']);
});
test('vocabulary stays alive across fields and documents', () => {
  const index = new LexicalSearch({ fields: { title: {}, body: {} } });
  index.addAll([{ id: 'a', fields: { title: 'hello' } }, { id: 'b', fields: { body: 'hello' } }]);
  index.remove('a'); assert.deepEqual(ids(index.search('hel', { prefix: true })), ['b']);
  index.remove('b'); assert.equal(index.stats().terms, 0);
});
test('prefix matching is prefix-only and expands final free term', () => {
  const index = make(doc('a', 'hello world'), doc('b', 'shell world'), doc('c', 'hello worm'));
  assert.deepEqual(ids(index.search('hello wor', { prefix: true, operator: 'all' })).sort(), ['a', 'c']);
  assert.deepEqual(index.search('ell', { prefix: true }), []);
});
test('fuzzy scores the actual matched term, not a missing query token', () => {
  const index = make(doc('a', 'hello hello'), doc('b', 'other'));
  const [hit] = index.search('helo', { fuzzy: 1, explain: true });
  assert.equal(hit.id, 'a'); assert.ok(hit.score > 0);
  assert.equal(hit.matches[0].term, 'hello'); assert.equal(hit.matches[0].distance, 1);
});
test('fuzzy matching uses Levenshtein: adjacent transposition costs two', () => {
  const index = make(doc('a', 'abcd'));
  assert.deepEqual(index.search('acbd', { fuzzy: 1 }), []);
  assert.deepEqual(ids(index.search('acbd', { fuzzy: 2 })), ['a']);
});
test('automatic fuzzy radius protects short queries', () => {
  const index = make(doc('a', 'ab'), doc('b', 'hello'), doc('c', 'abcdefgh'));
  assert.deepEqual(index.search('ac', { fuzzy: true }), []);
  assert.deepEqual(ids(index.search('helo', { fuzzy: true })), ['b']);
  assert.deepEqual(ids(index.search('abcxefzh', { fuzzy: true })), ['c']);
});
test('exact/prefix/fuzzy alternatives do not double count one query token', () => {
  const index = make(doc('a', 'hello'));
  const exact = index.search('hello', { explain: true });
  assert.deepEqual(index.search('hello', { prefix: true, fuzzy: 2, explain: true }), exact);
});
test('query repetition does not inflate scores', () => {
  const index = make(doc('a', 'hello world'));
  close(index.search('hello')[0].score, index.search('hello hello')[0].score);
});
test('all versus any terms and score explanations', () => {
  const index = make(doc('a', 'red green'), doc('b', 'red blue'), doc('c', 'green'));
  assert.deepEqual(ids(index.search('red green', { operator: 'all' })), ['a']);
  assert.equal(index.search('red green').length, 3);
  for (const hit of index.search('red green', { explain: true })) close(hit.score, hit.matches.reduce((sum, match) => sum + match.score, 0));
});
test('weighted fields affect ranking; field restriction is respected', () => {
  const index = new LexicalSearch({ fields: { title: { weight: 3 }, body: {} } });
  index.addAll([{ id: 'a', fields: { title: 'hello', body: 'else' } }, { id: 'b', fields: { title: 'else', body: 'hello' } }]);
  assert.deepEqual(ids(index.search('hello')), ['a', 'b']);
  assert.deepEqual(ids(index.search('hello', { fields: ['body'] })), ['b']);
  assert.deepEqual(index.search('hello', { fields: [] }), []);
});
test('phrase positions preserve order, adjacency and repeated words', () => {
  const index = make(doc('a', 'red fox red'), doc('b', 'fox red'), doc('c', 'red quick fox'), doc('d', 'red red fox'));
  assert.deepEqual(new Set(ids(index.search('"red fox"'))), new Set(['a', 'd']));
  assert.deepEqual(ids(index.search('"red red"')), ['d']);
  assert.deepEqual(index.search('"red fox fox"'), []);
});
test('phrase does not cross field boundaries', () => {
  const index = new LexicalSearch({ fields: { title: {}, body: {} } });
  index.add({ id: 'a', fields: { title: 'red', body: 'fox' } });
  assert.deepEqual(index.search('"red fox"'), []);
});
test('all quoted phrases are mandatory; free terms obey operator', () => {
  const index = make(doc('a', 'red fox blue bird hello'), doc('b', 'red fox blue bird'), doc('c', 'red fox hello'));
  assert.deepEqual(ids(index.search('"red fox" "blue bird" hello')), ['a']);
});
test('unclosed phrase rejects invalid syntax', () => assert.throws(() => make(doc('a', 'x')).search('"x'), SyntaxError));
test('stopwords remain available in phrase positions', () => {
  const index = new LexicalSearch({ analyzer: en });
  index.addAll([doc('a', 'cat and dog'), doc('b', 'cat dog'), doc('c', 'and the')]);
  assert.deepEqual(ids(index.search('"cat and dog"')), ['a']);
  assert.deepEqual(ids(index.search('"cat dog"')), ['b']);
  assert.deepEqual(ids(index.search('"and the"')), ['c']);
  assert.deepEqual(index.search('and the'), []);
});
test('filter is applied before top-k; global statistics remain unchanged', () => {
  const index = make(doc('a', 'rare', { group: 1 }), doc('b', 'rare rare', { group: 2 }));
  const all = index.search('rare');
  const filtered = index.search('rare', { limit: 1, filter: metadata => metadata.group === 1 });
  assert.equal(filtered[0].id, 'a'); close(filtered[0].score, all.find(hit => hit.id === 'a').score);
});
test('ID restriction and callback operate before truncation', () => {
  const index = make(doc('a', 'word'), doc('b', 'word'));
  const calls = [];
  assert.deepEqual(ids(index.search('word', { ids: new Set(['b']), filter: (_, id) => { calls.push(id); return true; } })), ['b']);
  assert.deepEqual(calls, ['b']);
});
test('pagination uses stable score-descending/id-ascending ordering and absolute ranks', () => {
  const index = make(...['z', 'a', 'b', 'c'].map(id => doc(id, 'word')));
  assert.deepEqual(index.search('word', { limit: 2, offset: 1 }).map(({ id, rank }) => [id, rank]), [['b', 2], ['c', 3]]);
  assert.equal(index.searchWithStats('word', { limit: 0 }).total, 4);
  assert.deepEqual(index.search('word', { limit: 0 }), []);
  assert.deepEqual(index.search('word', { offset: Number.MAX_SAFE_INTEGER }), []);
});
test('insertion order does not change scores or ties', () => {
  const docs = [doc('z', 'cat dog'), doc('a', 'cat dot'), doc('b', 'cat dots')];
  assert.deepEqual(make(...docs).search('cat do', { prefix: true, fuzzy: 2, explain: true }), make(...docs.toReversed()).search('cat do', { prefix: true, fuzzy: 2, explain: true }));
});
test('clear resets index and allows IDs to be reused', () => {
  const index = make(doc('a', 'first')); index.clear();
  assert.equal(index.size, 0); assert.equal(index.stats().terms, 0);
  index.add(doc('a', 'second')); assert.deepEqual(index.search('first'), []);
  assert.deepEqual(ids(index.search('second')), ['a']);
});
test('snapshots retain IDs, schema, metadata and deletions', () => {
  const index = make(doc('old', 'gone'), doc('Aa', 'hello world', { x: [1, true, null] }));
  index.remove('old'); index.upsert(doc('BB', 'hello'));
  const restored = LexicalSearch.fromJSON(index.serialize());
  assert.equal(restored.serialize(), index.serialize());
  assert.deepEqual(restored.search('helo', { fuzzy: 1 }), index.search('helo', { fuzzy: 1 }));
  assert.deepEqual(restored.search('gone'), []);
  restored.remove('Aa'); restored.add(doc('new', 'fresh'));
  assert.equal(restored.size, 2);
});
test('snapshots require matching analyzer and reject malformed content', () => {
  const index = new LexicalSearch({ analyzer: de }); index.add(doc('a', 'häuser'));
  assert.throws(() => LexicalSearch.fromJSON(index.serialize()), /analyzer mismatch/);
  assert.deepEqual(LexicalSearch.fromJSON(index.serialize(), de).search('haus'), index.search('haus'));
  const snapshot = index.toJSON(); snapshot.version = 999;
  assert.throws(() => LexicalSearch.fromJSON(snapshot, de), /format/);
  snapshot.version = 2; snapshot.documents.push(snapshot.documents[0]);
  assert.throws(() => LexicalSearch.fromJSON(snapshot, de), /Duplicate/);
});
test('metadata and returned records are isolated from caller mutation', () => {
  const metadata = { x: { y: 1 } }; const input = doc('a', 'word', metadata); const index = make(input);
  metadata.x.y = 2; input.fields.text = 'mutated';
  const hit = index.search('word')[0]; assert.equal(hit.metadata.x.y, 1); hit.metadata.x.y = 3;
  const fetched = index.get('a'); fetched.fields.text = 'mutated';
  assert.equal(index.get('a').metadata.x.y, 1); assert.equal(index.get('a').fields.text, 'word');
});
test('lossy metadata is rejected before changing the index', () => {
  const index = make(); const cycle = {}; cycle.self = cycle;
  for (const metadata of [{ x: undefined }, { x: NaN }, { x: BigInt(1) }, new Date(), cycle]) assert.throws(() => index.add(doc('a', 'word', metadata)));
  assert.equal(index.size, 0);
});
test('metadata passed to filters is immutable; mutations cannot corrupt snapshots', () => {
  const index = make(doc('a', 'word', { nested: { x: 1 } }));
  assert.throws(() => index.search('word', { filter: m => { m.nested.x = 2; return true; } }), TypeError);
  assert.equal(index.get('a').metadata.nested.x, 1);
});
test('reentrant mutation is rejected and the search lock is released on errors', () => {
  const index = make(doc('a', 'word'));
  assert.throws(() => index.search('word', { filter: () => { index.clear(); return true; } }), /Reentrant/);
  assert.equal(index.search('word').length, 1);
});
test('tokenization supports whitespace, punctuation, NFKC and non-Latin text', () => {
  const index = make(doc('a', 'Hello\nworld\tПривет! ＡＢＣ café'));
  for (const query of ['HELLO', 'world', 'привет', 'abc', 'cafe\u0301']) assert.equal(index.search(query)[0].id, 'a');
});
test('Unicode code-point edit distance handles supplementary letters', () => {
  const index = make(doc('a', '\u{10428}abcd'));
  assert.deepEqual(ids(index.search('abcd', { fuzzy: 1 })), ['a']);
});
test('code analyzer finds camelCase, acronyms, paths and snake_case components', () => {
  const index = new LexicalSearch({ analyzer: codeAnalyzer });
  index.add(doc('a', 'src/HTTPServer/getUser_name.ts'));
  for (const query of ['http server', 'get user', 'name', 'src']) assert.deepEqual(ids(index.search(query, { operator: 'all' })), ['a']);
});
for (const [language, analyzer, text, query] of [
  ['English', en, 'running runners', 'run'], ['German', de, 'Häuser', 'haus'],
  ['Spanish', es, 'hablando', 'hablar'], ['French', fr, 'manger', 'mange'], ['Japanese', ja, '東京で猫を見た', '猫'],
]) test(`${language} analyzer integrates with ranked retrieval and snapshot restore`, () => {
  const index = new LexicalSearch({ analyzer }); index.add(doc('a', text));
  assert.deepEqual(ids(index.search(query)), ['a']);
  assert.deepEqual(LexicalSearch.fromJSON(index.serialize(), analyzer).search(query), index.search(query));
});
test('phonetic agreement boosts only fuzzy candidates when explicitly enabled', () => {
  const analyzer = createAnalyzer({ id: 'test-phonetic-v1', tokenize: s => s.split(' '), phonetic: word => word[0] });
  const index = new LexicalSearch({ analyzer }); index.addAll([doc('a', 'cat'), doc('b', 'bat')]);
  const base = index.search('cot', { fuzzy: 2 }); const boosted = index.search('cot', { fuzzy: 2, phonetic: true });
  close(boosted.find(h => h.id === 'a').score, base.find(h => h.id === 'a').score * 1.1);
  close(boosted.find(h => h.id === 'b').score, base.find(h => h.id === 'b').score);
});
test('limits, schema, invalid options and capacity are checked', () => {
  for (const options of [{ k1: -1 }, { k1: Infinity }, { fields: {} }, { fields: { text: { weight: 0 } } }, { fields: { text: { b: 2 } } }, { maxDocuments: 0 }]) assert.throws(() => new LexicalSearch(options));
  const index = new LexicalSearch({ maxDocuments: 1 }); index.add(doc('a', 'word'));
  assert.throws(() => index.add(doc('b', 'word')), /capacity/);
  index.upsert(doc('a', 'updated'));
  for (const options of [{ fuzzy: 3 }, { limit: -1 }, { offset: .5 }, { operator: 'xor' }, { prefix: 1 }, { fields: ['bad'] }]) assert.throws(() => index.search('word', options));
  assert.throws(() => index.add(doc('', 'word')));
});
test('long tokens and long queries are rejected, not silently dropped', () => {
  const index = new LexicalSearch({ maxTokenLength: 8 });
  assert.throws(() => index.add(doc('a', 'x'.repeat(9))), /code points/);
  assert.throws(() => index.search('x '.repeat(129)), /128/);
});
test('exact lookup visits only relevant postings', () => {
  const index = new LexicalSearch();
  index.addAll(Array.from({ length: 1000 }, (_, i) => doc(String(i), `token${i}`)));
  const result = index.searchWithStats('token42');
  assert.equal(result.stats.postingsVisited, 1); assert.equal(result.stats.candidatesScored, 1);
});
test('CommonJS package entry and language modules load', () => {
  const require = createRequire(import.meta.url);
  const { LexicalSearch: CJS } = require('../dist/index.cjs');
  const { de: german } = require('../dist/de.cjs');
  const index = new CJS({ analyzer: german }); index.add(doc('a', 'Häuser'));
  assert.equal(index.search('haus')[0].id, 'a');
});

test('mandatory rare terms constrain broad phrase and AND clauses before scoring', () => {
  const index = new LexicalSearch();
  index.addAll(Array.from({ length: 1000 }, (_, i) => doc(String(i), `red fox token${i}`)));
  for (const [query, options] of [['"red fox" token42', {}], ['red token42', { operator: 'all' }]]) {
    const result = index.searchWithStats(query, options);
    assert.deepEqual(ids(result.hits), ['42']);
    assert.equal(result.stats.candidatesScored, 1);
    assert.ok(result.stats.postingsVisited < 10);
  }
});
test('small ID restrictions probe common-term postings directly', () => {
  const index = new LexicalSearch();
  index.addAll(Array.from({ length: 1000 }, (_, i) => doc(String(i), 'common')));
  const result = index.searchWithStats('common', { ids: new Set(['42', 'absent']) });
  assert.deepEqual(ids(result.hits), ['42']); assert.equal(result.stats.postingsVisited, 1);
});
test('metadata arrays reject extra properties, accessors and holes', () => {
  const extra = [1]; extra.secret = true;
  const accessor = [1]; Object.defineProperty(accessor, '0', { get() { return 1; } });
  const hole = []; hole.length = 1;
  for (const metadata of [extra, accessor, hole]) assert.throws(() => make(doc('a', 'word', metadata)));
});
test('streaming single-term path matches generic multi-field path', () => {
  const fast = new LexicalSearch(), generic = new LexicalSearch({ fields: { text: {}, empty: {} } });
  const docs = Array.from({ length: 100 }, (_, i) => doc(String(i), 'word '.repeat(i % 7 + 1) + 'other '.repeat(i % 3), { group: i % 2 }));
  fast.addAll(docs); generic.addAll(docs);
  for (const options of [{}, { offset: 7, limit: 5 }, { limit: 0 }, { filter: m => m.group === 1, explain: true }, { ids: new Set(['2', '7']), explain: true }]) {
    assert.deepEqual(fast.search('word', options), generic.search('word missingzz', options));
  }
});
