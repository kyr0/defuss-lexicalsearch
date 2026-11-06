import { createAnalyzer, normalizeToken, tokenizeJoined } from './analyzer';
import { stem_pt } from './stem/pt';
import { DEFAULT_STOPWORDS_PT } from './stopwords/pt';

/** Portuguese Snowball stemmer and stopwords. VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes. */
export const pt = createAnalyzer({
  id: 'pt-lexicalsearch-v1', language: 'pt', tokenize: tokenizeJoined, normalize: normalizeToken, stem: stem_pt, stopWords: DEFAULT_STOPWORDS_PT,
});
export default pt;
