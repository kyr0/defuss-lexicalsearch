import { c as createAnalyzer, n as normalizeToken, t as tokenizeJoined } from './analyzer-lEIu_Jj9.js';
import { s as stem_hi } from './hi-CTuhf2sB.js';
import './snowball-COqm-oKm.js';

const hi = createAnalyzer({
  id: "hi-lexicalsearch-v1",
  tokenize: tokenizeJoined,
  normalize: normalizeToken,
  stem: stem_hi
});

export { hi as default, hi };
