import { createAnalyzer, normalizeToken } from './analyzer';
const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
/** Requires Intl.Segmenter; use the same ICU data for reproducible snapshots. */
export const ja = createAnalyzer({
  id: 'ja-intl-word-v1', normalize: normalizeToken,
  tokenize: (text: string) => Array.from(segmenter.segment(text.normalize('NFKC')))
    .filter(segment => segment.isWordLike).map(segment => segment.segment),
});
export default ja;
