import { createAnalyzer, normalizeToken, tokenizeJoined } from './analyzer';
import { stem_ru } from './stem/ru';
import { DEFAULT_STOPWORDS_RU } from './stopwords/ru';

/**
 * Russian Snowball stemmer and stopwords. Normalization removes the stress marks of learner and dictionary texts
 * (U+0301, U+0300), also from precomposed letters such as `ѐ`, so `приве́т` matches `привет`. It removes no other mark,
 * because the breve of `й` distinguishes a letter; the stemmer folds `ё` to `е` itself.
 * VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes.
 */
export const ru = createAnalyzer({
  id: 'ru-lexicalsearch-v1', language: 'ru', tokenize: tokenizeJoined,
  normalize: (token: string) => normalizeToken(token).normalize('NFD').replace(/[\u0300\u0301]/g, '').normalize('NFC'),
  stem: stem_ru, stopWords: DEFAULT_STOPWORDS_RU,
});
export default ru;
