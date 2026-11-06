import { createAnalyzer, normalizeToken, tokenizeJoined } from './analyzer';
import { stem_it } from './stem/it';
import { DEFAULT_STOPWORDS_IT } from './stopwords/it';

/** Italian Snowball stemmer and stopwords. VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes. */
export const it = createAnalyzer({
  id: 'it-lexicalsearch-v1', language: 'it', tokenize: tokenizeJoined, normalize: normalizeToken, stem: stem_it, stopWords: DEFAULT_STOPWORDS_IT,
});
export default it;
