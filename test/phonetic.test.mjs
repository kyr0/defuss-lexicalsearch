import test from 'node:test';
import assert from 'node:assert/strict';
import { koelnerPhonetik, doubleMetaphone, spanishMetaphone } from '../dist/phonetic/index.js';

// Reference codes from the published Kölner Phonetik rule table and its worked examples.
test('Kölner Phonetik matches reference codes, including case, umlauts and C/D/T/P/X contexts', () => {
  for (const [word, code] of [['Müller-Lüdenscheidt', '65752682'], ['Breschnew', '17863'], ['Wikipedia', '3412'],
    ['Meier', '67'], ['Mayr', '67'], ['Anna', '06'], ['Hexe', '048'], ['Philipp', '351'], ['Matz', '68'], ['Xaver', '4837'],
    ['Claus', '458'], ['Spaß', '818'], ['', '']]) {
    assert.equal(koelnerPhonetik(word), code, word);
  }
  assert.equal(koelnerPhonetik('MÜLLER'), koelnerPhonetik('müller'));
});
test('Double Metaphone returns primary|alternate reference keys', () => {
  for (const [word, code] of [['Smith', 'SM0|XMT'], ['Schmidt', 'XMT|SMT'], ['Jose', 'HS|HS'], ['Xavier', 'SF|SFR'], ['Arnow', 'ARN|ARNF']]) {
    assert.equal(doubleMetaphone(word), code, word);
  }
});
test('Spanish metaphone treats every b/v and ll/y occurrence alike', () => {
  for (const [a, b] of [['bebida', 'vevida'], ['caballo', 'cavayo'], ['llamallave', 'yamayave'], ['chicha', 'xixa']]) {
    assert.equal(spanishMetaphone(a), spanishMetaphone(b), `${a} ~ ${b}`);
  }
  assert.notEqual(spanishMetaphone('bebida'), spanishMetaphone('beida'));
});
