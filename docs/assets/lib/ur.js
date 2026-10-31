import { c as createAnalyzer, n as normalizeToken, w as wordGrams, t as tokenizeJoined } from './analyzer-lEIu_Jj9.js';

const foldUrdu = (text) => text.normalize("NFKC").replace(/[ً-ٰٟ]/g, "").replace(/ك/g, "\u06A9").replace(/[يى]/g, "\u06CC");
const ur = createAnalyzer({
  id: "ur-trigram-v1",
  tokenize: wordGrams(3, true, new RegExp("\\p{Script=Arabic}", "u"), (text) => tokenizeJoined(foldUrdu(text))),
  normalize: normalizeToken,
  segmented: true
});

export { ur as default, ur };
