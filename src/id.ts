import { createAnalyzer, normalizeToken, tokenizeJoined } from './analyzer';
import { stem_id } from './stem/id';

/** Indonesian Snowball stemmer. VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes. */
export const id = createAnalyzer({
  id: 'id-lexicalsearch-v1', tokenize: tokenizeJoined, normalize: normalizeToken, stem: stem_id,
});
export default id;
