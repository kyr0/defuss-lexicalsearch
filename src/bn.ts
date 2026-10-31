import { createAnalyzer, normalizeToken, wordGrams } from './analyzer';

/**
 * Bengali words plus their overlapping trigrams, so inflected forms share most terms without a stemmer; soft hyphens and
 * zero-width (non-)joiners are removed first.
 * VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes.
 */
export const bn = createAnalyzer({ id: 'bn-trigram-v1', tokenize: wordGrams(3, true, /\p{Script=Bengali}/u), normalize: normalizeToken, segmented: true });
export default bn;
