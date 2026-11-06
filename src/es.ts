import { createAnalyzer, normalizeToken, tokenize } from './analyzer';
import { stem_es } from './stem/es';
import { DEFAULT_STOPWORDS_ES } from './stopwords/es';
import { spanishMetaphone } from './phonetic/es';

/** Spanish Snowball stemmer, stopwords and Spanish Metaphone. VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes. */
export const es = createAnalyzer({
  id: 'es-lexicalsearch-v1', language: 'es', tokenize, normalize: normalizeToken,
  stem: stem_es, stopWords: DEFAULT_STOPWORDS_ES, phonetic: spanishMetaphone,
});
export default es;
