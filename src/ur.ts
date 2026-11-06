import { createAnalyzer, normalizeToken, tokenizeJoined, wordGrams } from './analyzer';

/** Folds Arabic kaf and yeh to their Urdu forms and drops short vowel marks (U+064B–U+065F, U+0670). */
const foldUrdu = (text: string): string => text.normalize('NFKC')
  .replace(/[ً-ٰٟ]/g, '').replace(/ك/g, 'ک').replace(/[يى]/g, 'ی');

/**
 * Urdu words plus their overlapping trigrams, so inflected forms share most terms without a stemmer.
 * VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes.
 */
export const ur = createAnalyzer({
  id: 'ur-trigram-v1', language: 'ur', tokenize: wordGrams(3, true, /\p{Script=Arabic}/u, text => tokenizeJoined(foldUrdu(text))), normalize: normalizeToken, segmented: true,
});
export default ur;
