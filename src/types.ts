export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

/** Deterministic, versioned analysis. Change id whenever behavior changes. */
export interface Analyzer {
  readonly id: string;
  readonly tokenize: (text: string) => string[];
  readonly normalize?: (token: string) => string;
  readonly stem?: (token: string) => string;
  readonly stopWords?: readonly string[];
  readonly phonetic?: (token: string) => string;
  /** Keyword analyzers preserve the complete nonempty field as one token. */
  readonly kind?: 'text' | 'keyword';
}
export interface FieldOptions {
  weight?: number;
  b?: number;
  analyzer?: Analyzer;
  /** Analyze another configured, non-derived field without duplicating input data. */
  source?: string;
}
export type Ranking = 'relevance' | 'exact-first';
export type SearchMode = 'lexical' | 'exact' | 'prefix' | 'suffix' | 'substring';
export type MatchTier = 'incomplete' | 'fuzzy' | 'partial' | 'term' | 'identifier-prefix' | 'keyword' | 'literal';
export interface LexicalSearchOptions {
  fields?: Readonly<Record<string, FieldOptions>>;
  analyzer?: Analyzer;
  k1?: number;
  maxDocuments?: number;
  maxTokenLength?: number;
  ranking?: Ranking;
}
export interface LexicalDocument<M extends JsonValue = Record<string, JsonValue>> {
  id: string;
  fields: Record<string, string>;
  metadata?: M;
}
export interface TermMatch {
  query: string;
  term: string;
  field: string;
  kind: 'exact' | 'prefix' | 'suffix' | 'substring' | 'fuzzy' | 'literal';
  distance: number;
  score: number;
}
export interface SearchResult<M extends JsonValue = Record<string, JsonValue>> {
  id: string;
  rank: number;
  /** Raw score; ordering also uses tier when exact-first ranking is selected. */
  score: number;
  metadata?: M;
  matches?: TermMatch[];
  tier?: MatchTier;
}
export interface SearchOptions<M extends JsonValue = Record<string, JsonValue>> {
  limit?: number;
  offset?: number;
  operator?: 'any' | 'all';
  /** Lexical by default. Other modes compare original field strings, bypassing analysis/syntax. */
  mode?: SearchMode;
  /** Literal modes and literal ranking tier only. Default true. No Unicode normalization. */
  caseSensitive?: boolean;
  ranking?: Ranking;
  /** Lexical expansions; prefix expands the final free token only. */
  prefix?: boolean;
  suffix?: boolean;
  substring?: boolean;
  fuzzy?: boolean | 0 | 1 | 2;
  /** Adjacent transpositions cost one (optimal string alignment). Default false: Levenshtein. */
  transpositions?: boolean;
  phonetic?: boolean;
  fields?: readonly string[];
  filter?: (metadata: M | undefined, id: string) => boolean;
  ids?: ReadonlySet<string>;
  explain?: boolean;
  /** Exclude matches of these queries using the same mode, fields, operator and expansion settings. */
  exclude?: readonly string[];
}
export interface SearchStats {
  expandedTerms: number;
  postingsVisited: number;
  candidatesScored: number;
}
export interface SearchResponse<M extends JsonValue = Record<string, JsonValue>> {
  hits: SearchResult<M>[];
  total: number;
  stats: SearchStats;
}
export interface IndexStats {
  documents: number;
  terms: number;
  fields: Record<string, { documents: number; tokens: number; averageLength: number }>;
}
export interface Snapshot<M extends JsonValue = Record<string, JsonValue>> {
  format: 'defuss-lexicalsearch';
  version: 2;
  analyzer: string;
  options: {
    fields: Record<string, { weight: number; b: number; analyzer: string; source?: string }>;
    k1: number;
    maxDocuments: number;
    maxTokenLength: number;
    ranking: Ranking;
  };
  documents: LexicalDocument<M>[];
}
/** Custom/language analyzers are supplied by id, never serialized as executable code. */
export type AnalyzerRegistry = Readonly<Record<string, Analyzer>>;
export interface LoadOptions {
  analyzers?: Analyzer | AnalyzerRegistry;
  fetch?: typeof globalThis.fetch;
  request?: RequestInit;
  /** UTF-8 response limit, enforced while streaming. Default 64 MiB. */
  maxBytes?: number;
}
