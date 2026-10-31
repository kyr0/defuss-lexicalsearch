import { createAnalyzer, normalizeToken, tokenizeJoined } from './analyzer';
import { stem_hi } from './stem/hi';

/** Hindi Snowball stemmer. VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes. */
export const hi = createAnalyzer({
  id: 'hi-lexicalsearch-v1', tokenize: tokenizeJoined, normalize: normalizeToken, stem: stem_hi,
});
export default hi;
