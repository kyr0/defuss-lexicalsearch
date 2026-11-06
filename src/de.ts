import { createAnalyzer, normalizeToken, tokenize } from './analyzer';
import { stem_de } from './stem/de';
import { DEFAULT_STOPWORDS_DE } from './stopwords/de';
import { koelnerPhonetik } from './phonetic/de';

/** German Snowball stemmer, stopwords and Kölner Phonetik. VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes. */
export const de = createAnalyzer({
  id: 'de-lexicalsearch-v1', language: 'de', tokenize, normalize: normalizeToken,
  stem: stem_de, stopWords: DEFAULT_STOPWORDS_DE, phonetic: koelnerPhonetik,
});
export default de;
