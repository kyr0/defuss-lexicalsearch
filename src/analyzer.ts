import type { Analyzer } from './types';

export const normalizeToken = (token: string): string => token.normalize('NFKC').toLowerCase();

/** Unicode words and numbers, including combining marks; punctuation separates. */
export const tokenize = (text: string): string[] =>
  text.normalize('NFKC').match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu) ?? [];

export const unicodeAnalyzer: Analyzer = Object.freeze({
  id: 'unicode-nfkc-v1', tokenize, normalize: normalizeToken,
});

/** Split paths, snake_case, camelCase and acronym transitions into lexical terms. */
export const codeAnalyzer: Analyzer = Object.freeze({
  id: 'code-nfkc-v1',
  tokenize: (text: string) => tokenize(text
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')),
  normalize: normalizeToken,
});

export function createAnalyzer(config: Analyzer): Analyzer {
  if (!config || typeof config.id !== 'string' || !config.id || typeof config.tokenize !== 'function') {
    throw new TypeError('Analyzer requires a nonempty versioned id and tokenizer');
  }
  if (config.kind !== undefined && !['text', 'keyword'].includes(config.kind)) throw new TypeError('Invalid analyzer kind');
  for (const fn of [config.normalize, config.stem, config.phonetic]) {
    if (fn !== undefined && typeof fn !== 'function') throw new TypeError('Invalid analyzer function');
  }
  if (config.stopWords !== undefined && (!Array.isArray(config.stopWords) || config.stopWords.some(s => typeof s !== 'string'))) {
    throw new TypeError('stopWords must be strings');
  }
  return Object.freeze({ ...config, stopWords: Object.freeze([...(config.stopWords ?? [])]) });
}

/**
 * maxLength bounds indexed tokens only. Queries pass none: an over-long query token cannot equal any indexed token, so
 * it matches nothing exactly yet may still reach shorter terms through fuzzy expansion.
 * VERIFIED: a 22-code-point keyword query variant against maxTokenLength 5 used to throw (test/lexical.test.mjs).
 */
export function analyze(text: string, analyzer: Analyzer, maxLength = Infinity): string[] {
  const raw = analyzer.tokenize(text);
  if (!Array.isArray(raw)) throw new TypeError('Analyzer must return a token array');
  if (analyzer.kind === 'keyword' && (raw.length !== (text.length ? 1 : 0) || (text.length && raw[0] !== text))) throw new TypeError('Keyword tokenizer must preserve the complete input');
  return raw.map(token => {
    if (typeof token !== 'string') throw new TypeError('Analyzer tokens must be strings');
    const normalized = (analyzer.normalize ?? normalizeToken)(token);
    const term = analyzer.stem ? analyzer.stem(normalized) : normalized;
    // Reject instead of dropping: dropping a token could create a false phrase.
    if (typeof term !== 'string' || !term || Array.from(term).length > maxLength) {
      throw new RangeError(`Analyzed tokens must contain 1–${maxLength} code points`);
    }
    return term;
  });
}

/** Exact strings: preserve case, punctuation, whitespace and Unicode representation. */
export const keywordAnalyzer: Analyzer = Object.freeze({
  id: 'keyword-raw-v1', kind: 'keyword',
  tokenize: (text: string) => text.length ? [text] : [],
  normalize: (text: string) => text,
});
/** Punctuation-preserving Unicode lowercase, without compatibility normalization. */
export const foldedKeywordAnalyzer: Analyzer = Object.freeze({
  ...keywordAnalyzer, id: 'keyword-lower-v1', normalize: (text: string) => text.toLowerCase(),
});
/** Whitespace-separated symbols, e.g. source snippets; punctuation remains searchable. */
export const whitespaceAnalyzer: Analyzer = Object.freeze({
  id: 'whitespace-raw-v1', tokenize: (text: string) => text.match(/\S+/gu) ?? [], normalize: (text: string) => text,
});

/** Optional accent-insensitive text; folds marks (including distinctions such as ñ/n). */
export const accentFoldedAnalyzer: Analyzer = Object.freeze({
  ...unicodeAnalyzer, id: 'unicode-accent-folded-v1',
  normalize: (text: string) => text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase(),
});

export const builtinAnalyzers: Readonly<Record<string, Analyzer>> = Object.freeze(Object.fromEntries(
  [unicodeAnalyzer, codeAnalyzer, keywordAnalyzer, foldedKeywordAnalyzer, whitespaceAnalyzer, accentFoldedAnalyzer].map(a => [a.id, a]),
));
