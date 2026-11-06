import { c as createAnalyzer, n as normalizeToken, w as wordGrams } from './analyzer-CQNufUmw.js';

const bn = createAnalyzer({ id: "bn-trigram-v1", language: "bn", tokenize: wordGrams(3, true, new RegExp("\\p{Script=Bengali}", "u")), normalize: normalizeToken, segmented: true });

export { bn, bn as default };
