import { c as createAnalyzer } from './analyzer-lEIu_Jj9.js';
import { s as stem_tr } from './tr-DlYzd4DZ.js';
import './snowball-COqm-oKm.js';

const word = /[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu;
const tr = createAnalyzer({
  id: "tr-lexicalsearch-v1",
  tokenize: (text) => text.normalize("NFKC").replace(/[­‌‍]/g, "").replace(/([\p{L}\p{N}])['’][\p{L}\p{M}]+/gu, "$1").match(word) ?? [],
  normalize: (token) => token.normalize("NFKC").toLocaleLowerCase("tr"),
  stem: stem_tr
});

export { tr as default, tr };
