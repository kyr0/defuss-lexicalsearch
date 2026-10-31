import { c as createAnalyzer, n as normalizeToken, t as tokenizeJoined } from './analyzer-lEIu_Jj9.js';
import { s as stem_pl } from './pl-CZDKKmWr.js';
import './snowball-COqm-oKm.js';

const pl = createAnalyzer({
  id: "pl-lexicalsearch-v1",
  tokenize: tokenizeJoined,
  normalize: normalizeToken,
  stem: stem_pl
});

export { pl as default, pl };
