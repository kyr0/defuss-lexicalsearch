import { createAnalyzer, normalizeToken, tokenize } from './analyzer';
import { stem_fr } from './stem/fr';
import { DEFAULT_STOPWORDS_FR } from './stopwords/fr';
import { phonetic } from './phonetic/fr';

/** French Snowball stemmer, stopwords and French phonetic code. VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes. */
export const fr = createAnalyzer({
  id: 'fr-lexicalsearch-v1', tokenize, normalize: normalizeToken,
  stem: stem_fr, stopWords: DEFAULT_STOPWORDS_FR, phonetic: phonetic,
});
export default fr;
