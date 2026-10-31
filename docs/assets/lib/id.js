import { c as createAnalyzer, n as normalizeToken, t as tokenizeJoined } from './analyzer-lEIu_Jj9.js';
import { s as stem_id } from './id-BvMd_4fz.js';
import './snowball-COqm-oKm.js';

const id = createAnalyzer({
  id: "id-lexicalsearch-v1",
  tokenize: tokenizeJoined,
  normalize: normalizeToken,
  stem: stem_id
});

export { id as default, id };
