import { createAnalyzer, normalizeToken, tokenizeJoined } from './analyzer';

const TONES = /[\u0300\u0301\u0303\u0309\u0323]/u;
const VOWEL = /[aeiouy]\p{M}*$/u;

/**
 * Moves a syllable's tone mark behind its last vowel, so the old and new placements (`hòa`/`hoà`, `thủy`/`thuỷ`)
 * index the same term. The result is a matching key, not always a valid spelling.
 */
export function foldVietnameseTone(syllable: string): string {
  const chars = Array.from(syllable.normalize('NFD'));
  const tones = chars.filter(char => TONES.test(char));
  // A Vietnamese syllable carries one tone mark; other words, such as "résumé", stay as they are.
  if (tones.length !== 1) return syllable;
  const tone = tones[0];
  const rest = chars.filter(char => !TONES.test(char));
  let last = -1;
  for (let i = 0; i < rest.length; i++) if (VOWEL.test(rest.slice(0, i + 1).join(''))) last = i;
  while (last >= 0 && last + 1 < rest.length && /\p{M}/u.test(rest[last + 1])) last++;
  if (last < 0) return syllable;
  rest.splice(last + 1, 0, tone);
  return rest.join('').normalize('NFC');
}

/**
 * Vietnamese syllables with one tone mark placement. Accent folding (accentFoldedAnalyzer) would also match both
 * placements, but it merges distinct words such as `ma`, `má`, `mà` and `mạ`; moving the mark keeps the tone.
 * VERIFIED: snapshots persist the id and fromJSON resolves analyzers by it; change it when behavior changes.
 */
export const vi = createAnalyzer({
  id: 'vi-lexicalsearch-v1', tokenize: tokenizeJoined, normalize: (token: string) => foldVietnameseTone(normalizeToken(token)),
});
export default vi;
