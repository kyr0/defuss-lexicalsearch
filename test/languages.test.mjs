import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { LexicalSearch, createAnalyzer } from '../dist/index.js';
import * as stems from '../dist/stem/index.js';

const ENTRIES = ['en', 'de', 'es', 'fr', 'it', 'pt', 'nl', 'pl', 'ru', 'tr', 'id', 'vi', 'ar', 'ur', 'hi', 'bn', 'ja', 'zh', 'ko', 'th'];
const analyzers = Object.fromEntries(await Promise.all(ENTRIES.map(async code => [code, (await import(`../dist/${code}.js`)).default])));
const ids = hits => hits.map(hit => hit.id);
const indexOf = (analyzer, documents) => {
  const index = new LexicalSearch({ analyzer });
  index.addAll(Object.entries(documents).map(([id, text]) => ({ id, fields: { text } })));
  return index;
};

// VERIFIED: each generated stemmer reproduced Snowball 3.1.1's output.txt for every word of snowball-data's voc.txt
// (commit 019921c, 9.6 million words, 0 mismatches); these pairs are samples of that reference.
const SNOWBALL = {
  ar: [['عطفها', 'عطف'], ['وبمفتعلتك', 'مفتعل'], ['وكحجرك', 'كحجر']],
  hi: [['जायते', 'जाय'], ['शैडो', 'शैड']],
  id: [['berwenang', 'wenang'], ['kemilau', 'milau'], ['pesawat', 'sawat']],
  it: [['conoscervi', 'conosc'], ['eccezione', 'eccezion'], ['illustrata', 'illustr']],
  nl: [['drijfveren', 'drijfveer'], ['uitvallend', 'uitval'], ['wegbrengen', 'wegbreng']],
  pl: [['diabłów', 'diabł'], ['imperialnych', 'imperialn'], ['religijna', 'religijn']],
  pt: [['complicando', 'complic'], ['mestiço', 'mestic'], ['tratava', 'trat']],
  ru: [['вступая', 'вступ'], ['невыносимо', 'невыносим'], ['фортепианах', 'фортепиан'], ['рассеяться', 'рассея']],
  tr: [['başvurusundan', 'başvuru'], ['oyunuyla', 'oyun'], ['kültürler', 'kül']],
};
for (const [code, pairs] of Object.entries(SNOWBALL)) test(`${code} stemmer matches the Snowball reference output`, () => {
  for (const [word, stem] of pairs) assert.equal(stems[`stem_${code}`](word), stem, word);
});

test('every language entry loads in ESM and CommonJS with a versioned, distinct id', () => {
  const require = createRequire(import.meta.url);
  for (const code of ENTRIES) {
    const cjs = require(`../dist/${code}.cjs`);
    assert.equal(cjs[code].id, analyzers[code].id, code);
    assert.equal(cjs.default ?? cjs[code], cjs[code]);
  }
  assert.equal(new Set(ENTRIES.map(code => analyzers[code].id)).size, ENTRIES.length);
});

for (const [code, text, query] of [
  ['ru', 'Мы читали книги в библиотеке.', 'книга'],
  ['pl', 'Czytaliśmy książki w bibliotekach.', 'biblioteka'],
  ['pt', 'Estávamos lendo livros nas bibliotecas.', 'biblioteca'],
  ['it', 'Leggevamo libri nelle biblioteche.', 'biblioteca'],
  ['nl', 'We lazen boeken in de bibliotheken.', 'bibliotheek'],
  ['id', 'Kami membaca buku di perpustakaan.', 'baca'],
  ['tr', 'Kitapları kütüphanelerde okuduk.', 'kitap'],
  ['ar', 'قرأنا الكتب في المكتبات.', 'المكتبة'],
  ['hi', 'हमने पुस्तकालयों में किताबें पढ़ीं।', 'किताब'],
  ['zh', '我们在图书馆里读书。', '图书馆'],
  ['th', 'เราอ่านหนังสือในห้องสมุด', 'ห้องสมุด'],
  ['ko', '우리는 도서관에서 책을 읽었다.', '도서관'],
  ['bn', 'আমরা গ্রন্থাগারে বই পড়েছিলাম।', 'গ্রন্থাগার'],
  ['ur', 'ہم نے کتب خانوں میں کتابیں پڑھیں۔', 'کتاب'],
  ['vi', 'Chúng tôi đọc sách ở thư viện.', 'thư viện'],
]) test(`${code} analyzer finds an inflected or unspaced word and survives a snapshot`, () => {
  const index = indexOf(analyzers[code], { a: text, b: 'unrelated text' });
  assert.deepEqual(ids(index.search(query)), ['a']);
  assert.deepEqual(LexicalSearch.fromJSON(index.serialize(), analyzers[code]).search(query), index.search(query));
});

test('Russian ignores stress marks and folds ё to е', () => {
  const index = indexOf(analyzers.ru, { a: 'Приве́т, мир!', b: 'Ёлка в лесу.', c: 'Свѐкла' });
  assert.deepEqual(ids(index.search('привет')), ['a']);
  assert.deepEqual(ids(index.search('свекла')), ['c'], 'precomposed ѐ (U+0450)');
  assert.deepEqual(ids(index.search('елки')), ['b']);
  assert.deepEqual(ids(index.search('и')), [], 'a Snowball stop word');
});

test('Turkish lowercases dotted and dotless I and drops suffixes after an apostrophe', () => {
  const index = indexOf(analyzers.tr, { a: "İstanbul'da IŞIK yandı." });
  for (const query of ['istanbul', 'ışık', 'İSTANBUL']) assert.deepEqual(ids(index.search(query)), ['a'], query);
  assert.deepEqual(ids(index.search('da')), []);
});

test('Vietnamese matches the old and new tone mark placement', () => {
  const index = indexOf(analyzers.vi, { a: 'Hòa bình và thủy lợi', b: 'Khoẻ mạnh' });
  assert.deepEqual(ids(index.search('hoà')), ['a']);
  assert.deepEqual(ids(index.search('thuỷ')), ['a']);
  assert.deepEqual(ids(index.search('khỏe')), ['b']);
  assert.deepEqual(ids(indexOf(analyzers.vi, { a: 'résumé' }).search('resumé')), [], 'two marks: not a syllable, left unchanged');
});

test('soft hyphens and zero-width joiners inside words do not split them', () => {
  assert.deepEqual(ids(indexOf(analyzers.id, { a: 'perpus­takaan' }).search('perpustakaan')), ['a']);
  assert.deepEqual(ids(indexOf(analyzers.bn, { a: 'র‌্যাব' }).search('র্যাব')), ['a']);
});

test('segmented analyzers match any word of an unspaced query, or all of them under operator all', () => {
  const index = indexOf(analyzers.ja, { cat: '猫が好きです', tokyo: '東京に住んでいます' });
  assert.deepEqual(ids(index.search('東京の猫')).sort(), ['cat', 'tokyo']);
  assert.deepEqual(ids(index.search('東京の猫', { operator: 'all' })), []);
  assert.deepEqual(ids(index.search('東京に住んで', { operator: 'all' })), ['tokyo']);
  assert.deepEqual(ids(index.search('"東京に住んで"')), ['tokyo']);
  assert.deepEqual(ids(index.search('"住んで東京"')), [], 'phrases keep word order');
});

test('n-gram analyzers keep words of other scripts whole', () => {
  const index = indexOf(analyzers.ko, { a: '서울에서 Seoulite 만남', b: 'Seattle' });
  assert.deepEqual(ids(index.search('서울')), ['a']);
  assert.deepEqual(ids(index.search('Seo')), [], 'a Latin word is not split into bigrams');
  assert.deepEqual(ids(index.search('seoulite')), ['a']);
});

test('createAnalyzer validates segmented, and one id cannot name two segmentation policies', () => {
  assert.throws(() => createAnalyzer({ id: 'x-v1', tokenize: text => [text], segmented: 'yes' }), /segmented/);
  const a = createAnalyzer({ id: 'same-v1', tokenize: text => text.split(' ') });
  const b = createAnalyzer({ ...a, segmented: true });
  assert.throws(() => new LexicalSearch({ fields: { one: { analyzer: a }, two: { analyzer: b } } }), /Conflicting/);
});

test('every language entry names its language', () => {
  for (const code of ENTRIES) assert.equal(analyzers[code].language, code);
});

test('language weighs the fields of that language higher and keeps every other match', () => {
  const index = new LexicalSearch({ fields: { de: { analyzer: analyzers.de }, en: { analyzer: analyzers.en } } });
  index.addAll([{ id: 'de', fields: { de: 'Pinguine im Zoo' } }, { id: 'en', fields: { en: 'penguins at the zoo' } }]);
  const plain = Object.fromEntries(index.search('zoo').map(hit => [hit.id, hit.score]));
  const de = index.search('zoo', { language: 'de-CH' });
  assert.deepEqual(ids(de), ['de', 'en']);
  assert.equal(de[0].score, 3 * plain.de);
  assert.equal(de[1].score, plain.en);
  assert.deepEqual(ids(index.search('zoo', { language: 'en' })), ['en', 'de']);
  assert.equal(index.search('zoo', { language: 'de', languageBoost: 1 })[0].score, plain.de);
  // A wrong guess still finds the other language's document; a language without fields changes nothing.
  assert.deepEqual(ids(index.search('Pinguine', { language: 'en' })), ['de']);
  assert.deepEqual(index.search('zoo', { language: 'sv' }), index.search('zoo'));
  assert.deepEqual(LexicalSearch.fromJSON(index.serialize(), { [analyzers.de.id]: analyzers.de, [analyzers.en.id]: analyzers.en })
    .search('zoo', { language: 'en' }), index.search('zoo', { language: 'en' }));
  assert.equal(index.search('Pinguine im Zoo', { mode: 'exact', language: 'de' })[0].score, 3);
});

test('language and languageBoost are validated', () => {
  const index = indexOf(analyzers.de, { a: 'Zoo' });
  assert.throws(() => index.search('zoo', { language: 'not a tag' }), RangeError);
  assert.throws(() => index.search('zoo', { language: 7 }), TypeError);
  for (const languageBoost of [0.5, Infinity, '3']) assert.throws(() => index.search('zoo', { language: 'de', languageBoost }), RangeError);
  assert.throws(() => createAnalyzer({ id: 'x-v1', tokenize: text => [text], language: 'DE' }), /language/);
  const a = createAnalyzer({ id: 'same-v1', tokenize: text => text.split(' '), language: 'de' });
  assert.throws(() => new LexicalSearch({ fields: { one: { analyzer: a }, two: { analyzer: { ...a, language: 'en' } } } }), /Conflicting/);
});
