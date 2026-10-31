import test from 'node:test';
import assert from 'node:assert/strict';
import { LexicalSearch } from '../dist/index.js';

let seed = 0x5eed;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
const integer = n => Math.floor(random() * n);
const word = () => Array.from({ length: 1 + integer(7) }, () => 'abcd'[integer(4)]).join('');

/** Independent full-matrix edit-distance oracle, no trie/pruning. */
function distance(a, b) {
  a = Array.from(a); b = Array.from(b);
  const d = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]));
  }
  return d[a.length][b.length];
}

test('fuzzy trie equals exhaustive edit-distance oracle before and after deletions', () => {
  const words = [...new Set(Array.from({ length: 400 }, word))];
  const index = new LexicalSearch();
  index.addAll(words.map(term => ({ id: term, fields: { text: term } })));
  const alive = new Set(words);
  for (let phase = 0; phase < 2; phase++) {
    for (let i = 0; i < 80; i++) {
      const query = word(), radius = 1 + integer(2);
      const expected = [...alive].filter(term => distance(query, term) <= radius).sort();
      const actual = index.search(query, { fuzzy: radius, limit: words.length }).map(hit => hit.id).sort();
      assert.deepEqual(actual, expected, JSON.stringify({ query, radius, phase }));
    }
    for (let i = 0; i < words.length; i += 3) { index.remove(words[i]); alive.delete(words[i]); }
  }
});

test('prefix trie equals exhaustive startsWith oracle after mixed mutations', () => {
  const index = new LexicalSearch(), alive = new Map();
  for (let i = 0; i < 300; i++) {
    const id = String(integer(100)), text = word();
    if (integer(4) === 0) { index.remove(id); alive.delete(id); }
    else { index.upsert({ id, fields: { text } }); alive.set(id, text); }
  }
  for (let i = 0; i < 100; i++) {
    const query = word().slice(0, 1 + integer(3));
    assert.deepEqual(index.search(query, { prefix: true, limit: 1000 }).map(hit => hit.id).sort(), [...alive].filter(([, text]) => text.startsWith(query)).map(([id]) => id).sort());
  }
});

/** Brute-force, scan-based BM25 reference computed directly from source strings. */
function scoreAll(documents, query, schema, k1) {
  const terms = [...new Set(query.split(' '))];
  const score = new Map(documents.map(doc => [doc.id, 0]));
  for (const [field, config] of Object.entries(schema)) {
    const tokenized = documents.map(doc => ({ id: doc.id, tokens: (doc.fields[field] ?? '').split(' ').filter(Boolean) }));
    const present = tokenized.filter(doc => doc.tokens.length > 0);
    const average = present.reduce((sum, doc) => sum + doc.tokens.length, 0) / present.length;
    for (const term of terms) {
      const df = present.filter(doc => doc.tokens.includes(term)).length;
      const idf = Math.log(1 + (present.length - df + .5) / (df + .5));
      for (const doc of present) {
        const tf = doc.tokens.filter(token => token === term).length;
        if (!tf) continue;
        const saturation = tf * (k1 + 1) / (tf + k1 * (1 - config.b + config.b * doc.tokens.length / average));
        score.set(doc.id, score.get(doc.id) + config.weight * idf * saturation);
      }
    }
  }
  return [...score].filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
}

test('field-weighted ranking equals independent exhaustive BM25 oracle across mutations', () => {
  const schema = { title: { weight: 2.7, b: .3 }, body: { weight: 1, b: .75 } }, k1 = 1.2;
  const index = new LexicalSearch({ fields: schema, k1 }), alive = new Map();
  const vocab = ['cat', 'dog', 'fox', 'bird', 'rabbit'];
  for (let round = 0; round < 150; round++) {
    const id = String(integer(60));
    if (integer(4) === 0) { index.remove(id); alive.delete(id); }
    else {
      const doc = { id, fields: Object.fromEntries(Object.keys(schema).map(field => [field, Array.from({ length: integer(15) }, () => vocab[integer(vocab.length)]).join(' ')])) };
      index.upsert(doc); alive.set(id, doc);
    }
    if (!alive.size) continue;
    const query = `${vocab[integer(vocab.length)]} ${vocab[integer(vocab.length)]}`;
    const expected = scoreAll([...alive.values()], query, schema, k1);
    const actual = index.search(query, { limit: 100 });
    // Floating-point summation can alter exact ties across implementations; compare
    // membership and per-ID scores, plus descending score order within tolerance.
    assert.deepEqual(actual.map(x => x.id).sort(), expected.map(x => x[0]).sort());
    const oracle = new Map(expected);
    for (let i = 0; i < actual.length; i++) {
      assert.ok(Math.abs(actual[i].score - oracle.get(actual[i].id)) < 1e-11);
      if (i) assert.ok(actual[i - 1].score >= actual[i].score);
    }
    assert.deepEqual(index.search(query, { limit: 3 }), actual.slice(0, 3));
    assert.deepEqual(index.search(query, { limit: 3, offset: 2 }), actual.slice(2, 5));
    if (round % 20 === 0) assert.deepEqual(LexicalSearch.fromJSON(index.serialize()).search(query, { limit: 100 }), actual);
  }
});

test('phrase join equals exhaustive contiguous-sequence oracle', () => {
  const vocab = ['red', 'fox', 'bird', 'green'];
  const docs = Array.from({ length: 200 }, (_, i) => ({ id: String(i), fields: { text: Array.from({ length: 12 }, () => vocab[integer(vocab.length)]).join(' ') } }));
  const index = new LexicalSearch(); index.addAll(docs);
  for (let i = 0; i < 80; i++) {
    const phrase = Array.from({ length: 1 + integer(4) }, () => vocab[integer(vocab.length)]).join(' ');
    const expected = docs.filter(doc => ` ${doc.fields.text} `.includes(` ${phrase} `)).map(doc => doc.id).sort();
    assert.deepEqual(index.search(`"${phrase}"`, { limit: 1000 }).map(hit => hit.id).sort(), expected);
  }
});
