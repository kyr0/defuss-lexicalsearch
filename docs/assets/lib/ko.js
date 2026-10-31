import { c as createAnalyzer, n as normalizeToken, w as wordGrams } from './analyzer-lEIu_Jj9.js';

const ko = createAnalyzer({ id: "ko-bigram-v1", tokenize: wordGrams(2, false, new RegExp("\\p{Script=Hangul}", "u")), normalize: normalizeToken, segmented: true });

export { ko as default, ko };
