import { createAnalyzer, normalizeToken, segmentWords } from './analyzer';

/**
 * Thai word segmentation by Intl.Segmenter; use the same ICU data for reproducible snapshots. Thai writes no spaces
 * between words, so without segmentation a sentence is one token (VERIFIED: 98% R@5 segmented, 26% unsegmented, and
 * 96% with character bigrams on tiny-embedding-bench-v1).
 */
export const th = createAnalyzer({ id: 'th-intl-word-v1', language: 'th', tokenize: segmentWords('th'), normalize: normalizeToken, segmented: true });
export default th;
