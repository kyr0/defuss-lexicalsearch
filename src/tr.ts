import { createAnalyzer } from './analyzer';
import { stem_tr } from './stem/tr';

const word = /[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu;

/**
 * Turkish Snowball stemmer with Turkish casing (`I` → `ı`, `İ` → `i`). The tokenizer drops a suffix after an
 * apostrophe, so `İstanbul'da` indexes `istanbul`.
 * VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes.
 */
export const tr = createAnalyzer({
  id: 'tr-lexicalsearch-v1', language: 'tr',
  tokenize: (text: string) => (text.normalize('NFKC').replace(/[­‌‍]/g, '')
    .replace(/([\p{L}\p{N}])['’][\p{L}\p{M}]+/gu, '$1').match(word) ?? []),
  normalize: (token: string) => token.normalize('NFKC').toLocaleLowerCase('tr'),
  stem: stem_tr,
});
export default tr;
