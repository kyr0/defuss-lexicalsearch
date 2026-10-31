import { createAnalyzer, normalizeToken, tokenizeJoined } from './analyzer';
import { stem_pl } from './stem/pl';

/** Polish Snowball stemmer. VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes. */
export const pl = createAnalyzer({
  id: 'pl-lexicalsearch-v1', tokenize: tokenizeJoined, normalize: normalizeToken, stem: stem_pl,
});
export default pl;
