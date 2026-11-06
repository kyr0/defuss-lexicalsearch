import { c as createAnalyzer, n as normalizeToken, s as segmentWords } from './analyzer-CQNufUmw.js';

const ja = createAnalyzer({ id: "ja-intl-word-v1", language: "ja", tokenize: segmentWords("ja"), normalize: normalizeToken, segmented: true });

export { ja as default, ja };
