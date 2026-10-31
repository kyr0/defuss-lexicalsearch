import { createAnalyzer, normalizeToken, segmentWords } from './analyzer';
/**
 * Japanese word segmentation by Intl.Segmenter; use the same ICU data for reproducible snapshots.
 * VERIFIED: its tokens equal those of 0.2.0, and `segmented` changes query matching only, so 0.2.0 snapshots restore
 * under the unchanged id.
 */
export const ja = createAnalyzer({ id: 'ja-intl-word-v1', tokenize: segmentWords('ja'), normalize: normalizeToken, segmented: true });
export default ja;
