import { c as createAnalyzer, n as normalizeToken, s as segmentWords } from './analyzer-lEIu_Jj9.js';

const ja = createAnalyzer({ id: "ja-intl-word-v1", tokenize: segmentWords("ja"), normalize: normalizeToken, segmented: true });

export { ja as default, ja };
