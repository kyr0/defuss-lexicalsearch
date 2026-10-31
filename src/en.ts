import { createAnalyzer, normalizeToken, tokenize } from './analyzer';
import { stem_en } from './stem/en';
import { DEFAULT_STOPWORDS_EN } from './stopwords/en';
import { doubleMetaphone } from './phonetic/en';

/** English Snowball stemmer, stopwords and Double Metaphone. VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes. */
export const en = createAnalyzer({
  id: 'en-lexicalsearch-v1', tokenize, normalize: normalizeToken,
  stem: stem_en, stopWords: DEFAULT_STOPWORDS_EN, phonetic: doubleMetaphone,
});
export default en;
