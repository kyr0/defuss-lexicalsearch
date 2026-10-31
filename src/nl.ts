import { createAnalyzer, normalizeToken, tokenizeJoined } from './analyzer';
import { stem_nl } from './stem/nl';
import { DEFAULT_STOPWORDS_NL } from './stopwords/nl';

/** Dutch Snowball stemmer and stopwords. VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes. */
export const nl = createAnalyzer({
  id: 'nl-lexicalsearch-v1', tokenize: tokenizeJoined, normalize: normalizeToken, stem: stem_nl, stopWords: DEFAULT_STOPWORDS_NL,
});
export default nl;
