import { createAnalyzer, normalizeToken, wordGrams } from './analyzer';

/**
 * Korean as overlapping syllable bigrams of each space-separated word, the approach of Lucene's CJK bigram filter:
 * particles and endings attach to words, and a bigram index matches `학교` inside `학교에서` without a dictionary.
 * VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes.
 */
export const ko = createAnalyzer({ id: 'ko-bigram-v1', tokenize: wordGrams(2, false, /\p{Script=Hangul}/u), normalize: normalizeToken, segmented: true });
export default ko;
