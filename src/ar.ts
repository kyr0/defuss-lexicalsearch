import { createAnalyzer, normalizeToken, tokenizeJoined } from './analyzer';
import { stem_ar } from './stem/ar';

/** Arabic Snowball stemmer. VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes. */
export const ar = createAnalyzer({
  id: 'ar-lexicalsearch-v1', language: 'ar', tokenize: tokenizeJoined, normalize: normalizeToken, stem: stem_ar,
});
export default ar;
