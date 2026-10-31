import { c as createAnalyzer, n as normalizeToken } from './analyzer-CtBj-rhv.js';

const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
const ja = createAnalyzer({
  id: "ja-intl-word-v1",
  normalize: normalizeToken,
  tokenize: (text) => Array.from(segmenter.segment(text.normalize("NFKC"))).filter((segment) => segment.isWordLike).map((segment) => segment.segment)
});

export { ja as default, ja };
