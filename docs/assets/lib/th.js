import { c as createAnalyzer, n as normalizeToken, s as segmentWords } from './analyzer-lEIu_Jj9.js';

const th = createAnalyzer({ id: "th-intl-word-v1", tokenize: segmentWords("th"), normalize: normalizeToken, segmented: true });

export { th as default, th };
