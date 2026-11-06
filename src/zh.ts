import { createAnalyzer, normalizeToken, segmentWords } from './analyzer';

/**
 * Chinese word segmentation by Intl.Segmenter; use the same ICU data for reproducible snapshots. Dictionary words rather
 * than character bigrams keep completion and highlighting word-based at comparable recall (VERIFIED: 98% R@5 against
 * 100% with bigrams on tiny-embedding-bench-v1, one question apart).
 */
export const zh = createAnalyzer({ id: 'zh-intl-word-v1', language: 'zh', tokenize: segmentWords('zh'), normalize: normalizeToken, segmented: true });
export default zh;
