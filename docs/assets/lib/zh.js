import { c as createAnalyzer, n as normalizeToken, s as segmentWords } from './analyzer-lEIu_Jj9.js';

const zh = createAnalyzer({ id: "zh-intl-word-v1", tokenize: segmentWords("zh"), normalize: normalizeToken, segmented: true });

export { zh as default, zh };
