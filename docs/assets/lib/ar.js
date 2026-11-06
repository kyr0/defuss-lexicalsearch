import { c as createAnalyzer, n as normalizeToken, t as tokenizeJoined } from './analyzer-CQNufUmw.js';
import { s as stem_ar } from './ar-C-b1Gqbv.js';
import './snowball-COqm-oKm.js';

const ar = createAnalyzer({
  id: "ar-lexicalsearch-v1",
  language: "ar",
  tokenize: tokenizeJoined,
  normalize: normalizeToken,
  stem: stem_ar
});

export { ar, ar as default };
