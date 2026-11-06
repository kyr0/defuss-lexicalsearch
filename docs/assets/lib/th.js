import { c as createAnalyzer, n as normalizeToken, s as segmentWords } from './analyzer-CQNufUmw.js';

const th = createAnalyzer({ id: "th-intl-word-v1", language: "th", tokenize: segmentWords("th"), normalize: normalizeToken, segmented: true });

export { th as default, th };
