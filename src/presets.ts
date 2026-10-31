import { keywordAnalyzer, codeAnalyzer, unicodeAnalyzer } from './analyzer';
import type { LexicalSearchOptions } from './types';

/** Supply {symbol, description}; parts is derived automatically. Language analyzers remain optional. */
export const apiSearchPreset: Readonly<LexicalSearchOptions> = Object.freeze({
  ranking: 'exact-first', maxTokenLength: 1024,
  fields: Object.freeze({
    symbol: Object.freeze({ analyzer: keywordAnalyzer, weight: 4, b: 0 }),
    parts: Object.freeze({ source: 'symbol', analyzer: codeAnalyzer, weight: 2 }),
    description: Object.freeze({ analyzer: unicodeAnalyzer, weight: 1 }),
  }),
});
