import { c as createAnalyzer, t as tokenizeJoined, n as normalizeToken } from './analyzer-CQNufUmw.js';

const TONES = /[\u0300\u0301\u0303\u0309\u0323]/u;
const VOWEL = new RegExp("[aeiouy]\\p{M}*$", "u");
function foldVietnameseTone(syllable) {
  const chars = Array.from(syllable.normalize("NFD"));
  const tones = chars.filter((char) => TONES.test(char));
  if (tones.length !== 1) return syllable;
  const tone = tones[0];
  const rest = chars.filter((char) => !TONES.test(char));
  let last = -1;
  for (let i = 0; i < rest.length; i++) if (VOWEL.test(rest.slice(0, i + 1).join(""))) last = i;
  while (last >= 0 && last + 1 < rest.length && new RegExp("\\p{M}", "u").test(rest[last + 1])) last++;
  if (last < 0) return syllable;
  rest.splice(last + 1, 0, tone);
  return rest.join("").normalize("NFC");
}
const vi = createAnalyzer({
  id: "vi-lexicalsearch-v1",
  language: "vi",
  tokenize: tokenizeJoined,
  normalize: (token) => foldVietnameseTone(normalizeToken(token))
});

export { vi as default, foldVietnameseTone, vi };
