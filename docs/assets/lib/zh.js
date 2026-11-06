import { c as createAnalyzer, n as normalizeToken, s as segmentWords } from './analyzer-CQNufUmw.js';

const zh = createAnalyzer({ id: "zh-intl-word-v1", language: "zh", tokenize: segmentWords("zh"), normalize: normalizeToken, segmented: true });

export { zh as default, zh };
