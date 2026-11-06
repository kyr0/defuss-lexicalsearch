import { analyze, builtinAnalyzers, createAnalyzer, primaryLanguage, unicodeAnalyzer } from './analyzer';
import { parseQuery } from './query';
import { bm25Scorer } from './bm25';
import { TopK } from './heap';
import { compareString, Vocabulary } from './trie';
import { id as validateId, integer, ownJson, record } from './validation';
import type { Analyzer, IndexStats, JsonValue, SearchOptions, SearchResponse, SearchResult, SearchStats, Snapshot, TermMatch, LexicalDocument, LexicalSearchOptions, Ranking, MatchTier, AnalyzerRegistry, LoadOptions } from './types';

interface FieldIndex {
  weight: number;
  b: number;
  analyzer: Analyzer;
  source?: string;
  stopWords: Set<string>;
  vocabulary: Vocabulary;
  raw: Map<string, Set<string>>;
  documents: number;
  tokens: number;
  postings: Map<string, Map<string, number[]>>;
}
interface AnalyzedField { text: string; tokens: string[]; positions: Map<string, number[]> }
interface Stored<M extends JsonValue> { document: LexicalDocument<M>; fields: Map<string, AnalyzedField> }
interface Expansion { term: string; kind: TermMatch['kind']; distance: number; weight: number }
interface Candidate { id: string; score: number; quality: number; matches: TermMatch[] }
interface FieldPlan { name: string; tokens: string[]; expansions: Map<string, Expansion[]> }
interface Clause { key: number; phrase: boolean; fields: FieldPlan[]; cost: number }
const tiers: MatchTier[] = ['incomplete', 'fuzzy', 'partial', 'term', 'identifier-prefix', 'keyword', 'literal'];

/** Independent lexical index. No embeddings, vectors, network or runtime dependencies. */
export class LexicalSearch<M extends JsonValue = Record<string, JsonValue>> {
  private readonly analyzer: Analyzer;
  private readonly fields = new Map<string, FieldIndex>();
  private readonly documents = new Map<string, Stored<M>>();
  private readonly termFields = new Map<string, number>();
  private readonly ranking: Ranking;
  private readonly k1: number;
  private readonly maxDocuments: number;
  private readonly maxTokenLength: number;
  private busy = false;

  constructor(options: LexicalSearchOptions = {}) {
    if (!record(options as unknown)) throw new TypeError('Options must be an object');
    this.analyzer = createAnalyzer(options.analyzer ?? unicodeAnalyzer);
    this.ranking = options.ranking ?? 'relevance';
    if (!['relevance', 'exact-first'].includes(this.ranking)) throw new TypeError('Invalid ranking');
    this.k1 = options.k1 ?? 1.2;
    if (!Number.isFinite(this.k1) || this.k1 < 0 || this.k1 > 1000) throw new RangeError('k1 must be in [0, 1000]');
    this.maxDocuments = options.maxDocuments ?? 100_000;
    integer(this.maxDocuments, 'maxDocuments', 1);
    this.maxTokenLength = options.maxTokenLength ?? 128;
    integer(this.maxTokenLength, 'maxTokenLength', 1, 4096);
    const analyzerIds = new Map<string, Analyzer>([[this.analyzer.id, this.analyzer]]);
    const schema = options.fields ?? { text: {} };
    if (!record(schema as unknown) || !Object.keys(schema).length) throw new TypeError('At least one field is required');
    for (const name of Object.keys(schema).sort()) {
      if (!name || !record(schema[name] as unknown)) throw new TypeError('Invalid field configuration');
      const { weight = 1, b = 0.75 } = schema[name];
      if (!Number.isFinite(weight) || weight <= 0 || weight > 1e6) throw new RangeError('Field weight must be in (0, 1000000]');
      if (!Number.isFinite(b) || b < 0 || b > 1) throw new RangeError('Field b must be in [0, 1]');
      const analyzer = createAnalyzer(schema[name].analyzer ?? this.analyzer);
      const previousAnalyzer = analyzerIds.get(analyzer.id);
      if (previousAnalyzer && (previousAnalyzer.tokenize !== analyzer.tokenize || previousAnalyzer.normalize !== analyzer.normalize ||
        previousAnalyzer.stem !== analyzer.stem || previousAnalyzer.phonetic !== analyzer.phonetic || previousAnalyzer.kind !== analyzer.kind ||
        previousAnalyzer.segmented !== analyzer.segmented || previousAnalyzer.language !== analyzer.language ||
        JSON.stringify(previousAnalyzer.stopWords) !== JSON.stringify(analyzer.stopWords))) {
        throw new TypeError(`Conflicting analyzer definitions for id ${analyzer.id}`);
      }
      analyzerIds.set(analyzer.id, analyzer);
      const source = schema[name].source;
      if (source !== undefined && (typeof source !== 'string' || !Object.hasOwn(schema, source) || source === name || schema[source].source !== undefined)) {
        throw new TypeError('Derived field source must name a configured non-derived field');
      }
      this.fields.set(name, { weight, b, analyzer, source, stopWords: new Set((analyzer.stopWords ?? []).flatMap(word => analyze(word, analyzer, this.maxTokenLength))),
        vocabulary: new Vocabulary(), raw: new Map(), documents: 0, tokens: 0, postings: new Map() });
    }

  }

  get size(): number { return this.documents.size; }
  has(id: string): boolean { return this.documents.has(id); }

  /** Returns an owned JSON copy, never mutable internal state. */
  get(id: string): LexicalDocument<M> | undefined {
    const stored = this.documents.get(id);
    return stored ? JSON.parse(JSON.stringify(stored.document)) as LexicalDocument<M> : undefined;
  }

  private exclusive<T>(fn: () => T): T {
    if (this.busy) throw new Error('Reentrant search or mutation is not supported');
    this.busy = true;
    try { return fn(); } finally { this.busy = false; }
  }

  private prepare(input: LexicalDocument<M>): Stored<M> {
    if (!record(input as unknown)) throw new TypeError('Document must be an object');
    const id = input.id; validateId(id);
    if (!record(input.fields)) throw new TypeError('Document fields must be an object');
    const values: [string, string][] = [];
    const fields = new Map<string, AnalyzedField>();
    for (const name of Object.keys(input.fields).sort()) {
      const config = this.fields.get(name);
      if (!config) throw new TypeError(`Unknown field: ${name}`);
      if (config.source) throw new TypeError(`Derived field ${name} is populated from ${config.source}`);
      const text = input.fields[name];
      if (typeof text !== 'string') throw new TypeError(`Field ${name} must be a string`);
      values.push([name, text]);
    }
    const document: LexicalDocument<M> = { id, fields: Object.fromEntries(values) };
    if (input.metadata !== undefined) document.metadata = ownJson(input.metadata);
    for (const [name, config] of this.fields) {
      const source = config.source ?? name;
      if (!Object.hasOwn(document.fields, source)) continue;
      const text = document.fields[source];
      const tokens = analyze(text, config.analyzer, this.maxTokenLength);
      const positions = new Map<string, number[]>();
      tokens.forEach((term, position) => {
        const existing = positions.get(term);
        if (existing) existing.push(position); else positions.set(term, [position]);
      });
      fields.set(name, { text, tokens, positions });
    }
    return { document, fields };
  }

  /** All-or-nothing validation; duplicate IDs are rejected, including within a batch. */
  addAll(inputs: readonly LexicalDocument<M>[]): void {
    this.exclusive(() => {
      if (!Array.isArray(inputs)) throw new TypeError('addAll requires an array');
      if (inputs.length > this.maxDocuments - this.size) throw new RangeError('Document capacity exceeded');
      const ids = new Set<string>();
      const prepared = inputs.map(input => {
        const stored = this.prepare(input), id = stored.document.id;
        if (this.documents.has(id) || ids.has(id)) throw new Error(`Duplicate document id: ${id}`);
        ids.add(id); return stored;
      });
      prepared.forEach(item => this.insert(item));
    });
  }

  add(input: LexicalDocument<M>): void { this.addAll([input]); }

  /** Atomic replacement: validate and analyze completely before removing old postings. */
  upsert(input: LexicalDocument<M>): void {
    this.exclusive(() => {
      const prepared = this.prepare(input);
      if (!this.documents.has(prepared.document.id) && this.size >= this.maxDocuments) throw new RangeError('Document capacity exceeded');
      this.erase(prepared.document.id); this.insert(prepared);
    });
  }

  private insert(stored: Stored<M>): void {
    const id = stored.document.id;
    this.documents.set(id, stored);
    for (const [name, value] of stored.fields) {
      const field = this.fields.get(name)!;
      let rawIds = field.raw.get(value.text);
      if (!rawIds) { rawIds = new Set(); field.raw.set(value.text, rawIds); }
      rawIds.add(id);
      if (value.tokens.length) field.documents++;
      field.tokens += value.tokens.length;
      for (const [term, positions] of value.positions) {
        let posting = field.postings.get(term);
        if (!posting) {
          posting = new Map(); field.postings.set(term, posting);
          this.termFields.set(term, (this.termFields.get(term) ?? 0) + 1);
          field.vocabulary.add(term);
        }
        posting.set(id, positions);
      }
    }
  }

  remove(id: string): boolean { return this.exclusive(() => { validateId(id); return this.erase(id); }); }

  private erase(id: string): boolean {
    const stored = this.documents.get(id);
    if (!stored) return false;
    for (const [name, value] of stored.fields) {
      const field = this.fields.get(name)!;
      const rawIds = field.raw.get(value.text)!; rawIds.delete(id);
      if (!rawIds.size) field.raw.delete(value.text);
      if (value.tokens.length) field.documents--;
      field.tokens -= value.tokens.length;
      for (const term of value.positions.keys()) {
        const posting = field.postings.get(term)!;
        posting.delete(id);
        if (posting.size === 0) {
          field.postings.delete(term);
          field.vocabulary.delete(term);
          const count = this.termFields.get(term)! - 1;
          if (count) this.termFields.set(term, count);
          else this.termFields.delete(term);
        }
      }
    }
    this.documents.delete(id); return true;
  }

  clear(): void {
    this.exclusive(() => {
      this.documents.clear(); this.termFields.clear();
      for (const field of this.fields.values()) { field.documents = 0; field.tokens = 0; field.postings.clear(); field.raw.clear(); field.vocabulary = new Vocabulary(); }
    });
  }

  stats(): IndexStats {
    return {
      documents: this.size, terms: this.termFields.size,
      fields: Object.fromEntries(Array.from(this.fields, ([name, field]) => [name, {
        documents: field.documents, tokens: field.tokens, averageLength: field.documents ? field.tokens / field.documents : 0,
      }])),
    };
  }

  search(query: string, options: SearchOptions<M> = {}): SearchResult<M>[] { return this.searchWithStats(query, options).hits; }

  searchWithStats(query: string, options: SearchOptions<M> = {}): SearchResponse<M> {
    return this.exclusive(() => this.retrieve(query, options));
  }

  private retrieve(query: string, options: SearchOptions<M>): SearchResponse<M> {
    if (typeof query !== 'string' || query.length > 16384) throw new TypeError('Query must be a string of at most 16384 UTF-16 units');
    if (!record(options as unknown)) throw new TypeError('Search options must be an object');
    const { limit = 10, offset = 0, operator = 'any', mode = 'lexical', ranking = this.ranking, caseSensitive = true } = options;
    integer(limit, 'limit', 0); integer(offset, 'offset', 0);
    if (!['any', 'all'].includes(operator)) throw new TypeError('operator must be any or all');
    if (!['lexical', 'exact', 'prefix', 'suffix', 'substring'].includes(mode)) throw new TypeError('Invalid mode');
    if (!['relevance', 'exact-first'].includes(ranking)) throw new TypeError('Invalid ranking');
    if (![false, true, 0, 1, 2].includes(options.fuzzy ?? false)) throw new TypeError('fuzzy must be boolean, 0, 1 or 2');
    for (const flag of [caseSensitive, options.prefix ?? false, options.suffix ?? false, options.substring ?? false,
      options.transpositions ?? false, options.phonetic ?? false, options.explain ?? false]) if (typeof flag !== 'boolean') throw new TypeError('Search flags must be boolean');
    if (options.filter !== undefined && typeof options.filter !== 'function') throw new TypeError('filter must be a function');
    if (options.ids !== undefined && !(options.ids instanceof Set)) throw new TypeError('ids must be a Set');
    if (options.fields !== undefined && !Array.isArray(options.fields)) throw new TypeError('fields must be an array');
    if (options.exclude !== undefined && (!Array.isArray(options.exclude) || options.exclude.length > 32 || options.exclude.some(s => typeof s !== 'string'))) throw new TypeError('exclude requires at most 32 query strings');
    if (mode !== 'lexical' && (options.prefix || options.suffix || options.substring || options.fuzzy || options.phonetic)) throw new TypeError('Literal modes cannot use lexical expansions');
    const names = options.fields ? [...new Set(options.fields)].sort() : [...this.fields.keys()];
    for (const name of names) if (!this.fields.has(name)) throw new TypeError(`Unknown search field: ${name}`);
    if (options.language !== undefined && typeof options.language !== 'string') throw new TypeError('language must be a string');
    const language = options.language === undefined ? undefined : primaryLanguage(options.language);
    const languageBoost = options.languageBoost ?? 3;
    if (typeof languageBoost !== 'number' || !Number.isFinite(languageBoost) || languageBoost < 1 || languageBoost > 1e6) throw new RangeError('languageBoost must be in [1, 1000000]');
    // A boost, not a field restriction. VERIFIED (2026-11-06 probe, defuss-lid 0.5.0 major_20 guesses): searching only the
    // guessed field lost 4 of 22 keyword queries over defuss-search's sample notes, such as "penguins" (guessed French),
    // which the boost still finds; ARCH.md has the benchmark figures.
    const weightOf = (field: FieldIndex) => language !== undefined && field.analyzer.language === language ? field.weight * languageBoost : field.weight;
    const stats: SearchStats = { expandedTerms: 0, postingsVisited: 0, candidatesScored: 0 };
    const excluded = new Set<string>();
    for (const negative of options.exclude ?? []) {
      const response = this.retrieve(negative, { ...options, exclude: undefined, filter: undefined, limit: this.size, offset: 0, explain: false });
      response.hits.forEach(hit => excluded.add(hit.id));
      stats.expandedTerms += response.stats.expandedTerms;
      stats.postingsVisited += response.stats.postingsVisited;
    }
    const accepted = new Map<string, boolean>();
    const accepts = (id: string): boolean => {
      let ok = accepted.get(id);
      if (ok === undefined) {
        ok = !excluded.has(id) && (!options.ids || options.ids.has(id)) && (!options.filter || !!options.filter(this.documents.get(id)!.document.metadata, id));
        accepted.set(id, ok);
      }
      return ok;
    };
    const compare = (a: Candidate, b: Candidate) => (ranking === 'exact-first' ? b.quality - a.quality : 0) || b.score - a.score || compareString(a.id, b.id);
    const top = new TopK<Candidate>(limit === 0 ? 0 : Math.min(this.size, offset + Math.min(this.size, limit)), compare);
    let total = 0;
    const emit = (candidate: Candidate) => { total++; stats.candidatesScored++; top.add(candidate); };
    const finish = (): SearchResponse<M> => ({ total, stats, hits: top.sorted().slice(offset, offset + limit).map((candidate, i) => {
      const result: SearchResult<M> = { id: candidate.id, rank: offset + i + 1, score: candidate.score };
      const metadata = this.documents.get(candidate.id)!.document.metadata;
      if (metadata !== undefined) result.metadata = JSON.parse(JSON.stringify(metadata)) as M;
      if (options.explain) result.matches = candidate.matches;
      if (ranking === 'exact-first') result.tier = tiers[candidate.quality];
      return result;
    }) });
    if (mode !== 'lexical') {
      if (!query.length || !names.length) return finish();
      const needle = caseSensitive ? query : query.toLowerCase();
      const candidates = new Map<string, Candidate>();
      for (const name of names) {
        const field = this.fields.get(name)!;
        const add = (id: string, text: string) => {
          stats.postingsVisited++;
          if (!accepts(id)) return;
          let candidate = candidates.get(id);
          if (!candidate) { candidate = { id, score: 0, quality: mode === 'exact' ? 6 : mode === 'substring' ? 2 : 4, matches: [] }; candidates.set(id, candidate); }
          candidate.score += weightOf(field);
          if (options.explain) candidate.matches.push({ query, term: text, field: name, kind: 'literal', distance: 0, score: weightOf(field) });
        };
        if (mode === 'exact' && caseSensitive) {
          const matches = field.raw.get(query);
          if (matches) {
            const probes = options.ids && options.ids.size < matches.size ? [...options.ids].filter(id => matches.has(id)) : matches;
            for (const id of probes) add(id, query);
          }
        } else {
          const entries = options.ids ? Array.from(options.ids, id => [id, this.documents.get(id)] as const) : this.documents;
          for (const [id, stored] of entries) {
            const text = stored?.fields.get(name)?.text;
            if (text === undefined) continue;
            const value = caseSensitive ? text : text.toLowerCase();
            const matches = mode === 'exact' ? value === needle : mode === 'prefix' ? value.startsWith(needle) : mode === 'suffix' ? value.endsWith(needle) : value.includes(needle);
            // Count scans as visited even when no match; exact lookup counts returned IDs only.
            if (matches) add(id, text); else stats.postingsVisited++;
          }
        }
      }
      for (const candidate of candidates.values()) emit(candidate);
      return finish();
    }

    const parsed = parseQuery(query);
    const clauses: Clause[] = [];
    const scorePlans = new Map<string, Map<string, Expansion[]>>();
    const tokenCounts = new Map<string, number>();
    const addClause = (raw: string, phrase: boolean, last: boolean) => {
      const fields: FieldPlan[] = [];
      for (const name of names) {
        const field = this.fields.get(name)!;
        const variants = !phrase && parsed.free.length > 1 && !parsed.phrases.length && field.analyzer.kind === 'keyword' ? [raw, parsed.literal] : [raw];
        for (const variant of variants) {
        const analyzed = analyze(variant, field.analyzer);
        const count = (tokenCounts.get(name) ?? 0) + analyzed.length; tokenCounts.set(name, count);
        if (count > 128) throw new RangeError('Query exceeds 128 analyzed tokens per field');
        const tokens = phrase ? analyzed : analyzed.filter(term => !field.stopWords.has(term));
        if (!tokens.length) continue;
        const expansions = new Map<string, Expansion[]>();
        for (const term of [...new Set(tokens)].sort()) {
          const list = this.expand(field, term, phrase ? {} : { ...options, prefix: !!options.prefix && last && term === tokens.at(-1) });
          expansions.set(term, list);
          let fieldPlans = scorePlans.get(name);
          if (!fieldPlans) { fieldPlans = new Map(); scorePlans.set(name, fieldPlans); }
          const previous = fieldPlans.get(term);
          if (!previous || list.length > previous.length) fieldPlans.set(term, list);
        }
        fields.push({ name, tokens, expansions });
        }
      }
      if (fields.length) clauses.push({ key: clauses.length, phrase, fields, cost: 0 });
    };
    parsed.free.forEach((raw, i) => addClause(raw, false, i === parsed.free.length - 1));
    parsed.phrases.forEach(raw => addClause(raw, true, false));
    if (!clauses.length || !this.size || !names.length) return finish();
    for (const plan of scorePlans.values()) for (const list of plan.values()) stats.expandedTerms += list.length;
    const lists = (field: FieldIndex, expansions: Expansion[]) => expansions.flatMap(e => {
      const posting = field.postings.get(e.term); return posting ? [posting] : [];
    });
    for (const clause of clauses) clause.cost = clause.fields.reduce((sum, fp) => sum + Math.min(...[...fp.expansions.values()].map(expansions =>
      lists(this.fields.get(fp.name)!, expansions).reduce((n, p) => n + p.size, 0))), 0);
    const literalQuery = parsed.literal;
    const literal = (id: string): boolean => names.some(name => {
      const text = this.documents.get(id)!.fields.get(name)?.text;
      return text !== undefined && (caseSensitive ? text === literalQuery : text.toLowerCase() === literalQuery.toLowerCase());
    });
    const quality = (field: FieldIndex, kind: TermMatch['kind']): number => kind === 'exact' ? (field.analyzer.kind === 'keyword' ? 5 : 3)
      : kind === 'prefix' || kind === 'suffix' ? (field.analyzer.kind === 'keyword' ? 4 : 2) : kind === 'substring' ? 2 : 1;

    // Fast common path: stream a single posting into bounded top-k.
    if (clauses.length === 1 && !clauses[0].phrase && clauses[0].fields.every(fp => fp.tokens.length === 1)) {
      const active = clauses[0].fields.flatMap(fp => [...fp.expansions].flatMap(([term, exps]) => exps.flatMap(exp =>
        this.fields.get(fp.name)!.postings.has(exp.term) ? [{ name: fp.name, term, exp }] : [])));
      if (active.length === 1) {
        const { name, term, exp } = active[0], field = this.fields.get(name)!, posting = field.postings.get(exp.term)!;
        const score = bm25Scorer(posting.size, field.documents, field.tokens / field.documents, this.k1, field.b, exp.weight * weightOf(field));
        const noMatches: TermMatch[] = [];
        for (const [id, positions] of this.entries(posting, options.ids)) {
          stats.postingsVisited++;
          const stored = this.documents.get(id)!;
          // This posting yields each ID once: no acceptance cache is needed here.
          if (excluded.has(id) || (options.filter && !options.filter(stored.document.metadata, id))) continue;
          const value = score(positions.length, stored.fields.get(name)!.tokens.length);
          emit({ id, score: value, quality: ranking === 'exact-first' ? (literal(id) ? 6 : quality(field, exp.kind)) : 0,
            matches: options.explain ? [{ query: term, term: exp.term, field: name, kind: exp.kind, distance: exp.distance, score: value }] : noMatches });
        }
        return finish();
      }
    }

    const matchField = (fp: FieldPlan, phrase: boolean, allowed?: ReadonlySet<string>): Set<string> => {
      const field = this.fields.get(fp.name)!;
      const groups = [...fp.expansions.values()].map(expansions => lists(field, expansions)).sort((a, b) =>
        a.reduce((n, p) => n + p.size, 0) - b.reduce((n, p) => n + p.size, 0));
      const found = new Set<string>();
      // A segmented analyzer's tokens are separate words, so under OR one of them suffices; otherwise all must occur.
      const anyToken = !phrase && operator === 'any' && !!field.analyzer.segmented;
      for (const posting of anyToken ? groups.flat() : groups[0]) for (const [id] of this.entries(posting, allowed)) {
        stats.postingsVisited++;
        if (found.has(id) || !accepts(id) || (!anyToken && !groups.every(group => group.some(p => p.has(id))))) continue;
        if (phrase) {
          const stored = this.documents.get(id)!.fields.get(fp.name)!;
          let anchor = 0;
          for (let i = 1; i < fp.tokens.length; i++) if (stored.positions.get(fp.tokens[i])!.length < stored.positions.get(fp.tokens[anchor])!.length) anchor = i;
          if (!stored.positions.get(fp.tokens[anchor])!.some(position => {
            const start = position - anchor;
            return start >= 0 && fp.tokens.every((term, i) => stored.tokens[start + i] === term);
          })) continue;
        }
        found.add(id);
      }
      return found;
    };
    const free = clauses.filter(c => !c.phrase), phrases = clauses.filter(c => c.phrase);
    // A unit is an OR of clauses; units are ANDed. Rare mandatory units restrict common postings.
    const units: Clause[][] = [...(operator === 'all' ? free.map(c => [c]) : free.length ? [free] : []), ...phrases.map(c => [c])];
    units.sort((a, b) => a.reduce((n, c) => n + c.cost, 0) - b.reduce((n, c) => n + c.cost, 0));
    let allowed: ReadonlySet<string> | undefined = options.ids;
    for (const unit of units) {
      const found = new Set<string>();
      for (const clause of unit) for (const fp of clause.fields) for (const id of matchField(fp, clause.phrase, allowed)) found.add(id);
      allowed = found;
      if (!allowed.size) return finish();
    }
    const candidates = new Map<string, Candidate>();
    const bestQuality = new Map<string, Map<string, Map<string, number>>>();
    for (const name of names) {
      const field = this.fields.get(name)!, plans = scorePlans.get(name);
      if (!plans) continue;
      for (const [term, expansions] of [...plans].sort(([a], [b]) => compareString(a, b))) {
        const best = new Map<string, TermMatch>();
        for (const exp of expansions) {
          const posting = field.postings.get(exp.term);
          if (!posting) continue;
          const scorer = bm25Scorer(posting.size, field.documents, field.tokens / field.documents, this.k1, field.b, exp.weight * weightOf(field));
          for (const [id, positions] of this.entries(posting, allowed)) {
            stats.postingsVisited++;
            const score = scorer(positions.length, this.documents.get(id)!.fields.get(name)!.tokens.length);
            const previous = best.get(id);
            const q = quality(field, exp.kind), pq = previous ? quality(field, previous.kind) : -1;
            if (!previous || (ranking === 'exact-first' && q !== pq ? q > pq : score > previous.score)) {
              best.set(id, { query: term, term: exp.term, field: name, kind: exp.kind, distance: exp.distance, score });
            }
            if (ranking === 'exact-first') {
            let byField = bestQuality.get(id); if (!byField) { byField = new Map(); bestQuality.set(id, byField); }
            let byTerm = byField.get(name); if (!byTerm) { byTerm = new Map(); byField.set(name, byTerm); }
            byTerm.set(term, Math.max(byTerm.get(term) ?? 0, q));
            }
          }
        }
        for (const [id, match] of best) {
          let candidate = candidates.get(id);
          if (!candidate) { candidate = { id, score: 0, quality: 0, matches: [] }; candidates.set(id, candidate); }
          candidate.score += match.score;
          if (options.explain) candidate.matches.push(match);
        }
      }
    }
    for (const candidate of candidates.values()) {
      if (ranking === 'exact-first') candidate.quality = literal(candidate.id) ? 6 : Math.min(...clauses.map(clause => Math.max(...clause.fields.map(fp =>
        Math.min(...fp.tokens.map(term => bestQuality.get(candidate.id)?.get(fp.name)?.get(term) ?? 0))))));
      emit(candidate);
    }
    return finish();
  }

  private *entries(posting: Map<string, number[]>, ids?: ReadonlySet<string>): IterableIterator<[string, number[]]> {
    if (ids && ids.size < posting.size) {
      for (const id of ids) { const positions = posting.get(id); if (positions) yield [id, positions]; }
    } else for (const entry of posting) if (!ids || ids.has(entry[0])) yield entry;
  }

  private expand(field: FieldIndex, query: string, options: SearchOptions<M>): Expansion[] {
    const found = new Map<string, Expansion>();
    found.set(query, { term: query, kind: 'exact', distance: 0, weight: 1 });
    const add = (terms: string[], kind: Expansion['kind'], weight: number) => {
      for (const term of terms) if (!found.has(term)) found.set(term, { term, kind, distance: 0, weight });
    };
    if (options.prefix) add(field.vocabulary.prefix(query), 'prefix', .8);
    if (options.suffix) add(field.vocabulary.suffix(query), 'suffix', .75);
    if (options.substring) add(field.vocabulary.substring(query), 'substring', .65);
    const length = Array.from(query).length;
    const radius = options.fuzzy === true ? (length >= 6 ? 2 : length >= 3 ? 1 : 0) : Number(options.fuzzy ?? 0);
    if (radius > 0) {
      const code = options.phonetic && field.analyzer.phonetic ? field.analyzer.phonetic(query) : '';
      // With prefix, a typo may sit in the part typed so far ("Kül" for "Kühlschrank"); such a completion weighs
      // like prefix against exact (.8), so a whole-word typo outranks it.
      for (const neighbor of field.vocabulary.fuzzy(query, radius, options.transpositions, !!options.prefix)) {
        if (found.has(neighbor.term)) continue;
        const boost = code && field.analyzer.phonetic?.(neighbor.term) === code ? 1.1 : 1;
        const weight = .55 * boost * (neighbor.completion ? .8 : 1) / neighbor.distance;
        found.set(neighbor.term, { term: neighbor.term, distance: neighbor.distance, kind: 'fuzzy', weight });
      }
    }
    return [...found.values()].sort((a, b) => b.weight - a.weight || compareString(a.term, b.term));
  }

  toJSON(): Snapshot<M> {
    return {
      format: 'defuss-lexicalsearch', version: 2, analyzer: this.analyzer.id,
      options: {
        fields: Object.fromEntries(Array.from(this.fields, ([name, field]) => [name, {
          weight: field.weight, b: field.b, analyzer: field.analyzer.id, ...(field.source ? { source: field.source } : {}),
        }])),
        k1: this.k1, maxDocuments: this.maxDocuments, maxTokenLength: this.maxTokenLength, ranking: this.ranking,
      },
      documents: [...this.documents.keys()].sort(compareString).map(id => this.get(id)!),
    };
  }
  serialize(): string { return JSON.stringify(this.toJSON()); }

  /** Rebuild all derived state from a version 2 snapshot; analyzers resolve by id. VERIFIED: any other format or version throws before an index is built. */
  static fromJSON<M extends JsonValue = Record<string, JsonValue>>(input: unknown, analyzers?: Analyzer | AnalyzerRegistry): LexicalSearch<M> {
    const value: unknown = typeof input === 'string' ? JSON.parse(input) : input;
    if (!record(value) || value.format !== 'defuss-lexicalsearch' || value.version !== 2) throw new TypeError('Unsupported snapshot format/version');
    if (!record(value.options) || !record(value.options.fields) || !Array.isArray(value.documents)) throw new TypeError('Invalid snapshot');
    const registry: Record<string, Analyzer> = Object.assign(Object.create(null), builtinAnalyzers);
    if (analyzers !== undefined) {
      if (!record(analyzers as unknown)) throw new TypeError('Invalid analyzer registry');
      if (typeof analyzers.id === 'string' && typeof analyzers.tokenize === 'function') {
        const analyzer = createAnalyzer(analyzers as Analyzer); registry[analyzer.id] = analyzer;
      } else for (const [id, config] of Object.entries(analyzers)) {
        const analyzer = createAnalyzer(config as Analyzer);
        if (id !== analyzer.id) throw new Error('analyzer mismatch: registry key must equal analyzer id');
        registry[id] = analyzer;
      }
    }
    const resolve = (id: unknown): Analyzer => {
      if (typeof id !== 'string' || !registry[id]) throw new Error(`Snapshot analyzer mismatch: missing ${String(id)}`);
      return registry[id];
    };
    const analyzer = resolve(value.analyzer);
    for (const key of ['k1', 'maxDocuments', 'maxTokenLength']) if (typeof value.options[key] !== 'number') throw new TypeError(`Missing snapshot option: ${key}`);
    const fields = Object.fromEntries(Object.entries(value.options.fields).map(([name, field]) => {
      if (!record(field) || typeof field.weight !== 'number' || typeof field.b !== 'number') throw new TypeError('Invalid snapshot field');
      if (field.source !== undefined && typeof field.source !== 'string') throw new TypeError('Invalid field source');
      return [name, { weight: field.weight, b: field.b, analyzer: resolve(field.analyzer), source: field.source as string | undefined }];
    }));
    if (!['relevance', 'exact-first'].includes(value.options.ranking as string)) throw new TypeError('Invalid snapshot ranking');
    const index = new LexicalSearch<M>({ fields, analyzer, k1: value.options.k1 as number,
      maxDocuments: value.options.maxDocuments as number, maxTokenLength: value.options.maxTokenLength as number,
      ranking: value.options.ranking as Ranking });
    index.addAll(value.documents as LexicalDocument<M>[]);
    return index;
  }

  /** Explicit network access only. Bound response size and validate before exposing an index. */
  static async fromURL<M extends JsonValue = Record<string, JsonValue>>(url: string | URL, options: LoadOptions = {}): Promise<LexicalSearch<M>> {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new TypeError('Snapshot URL must use HTTP(S)');
    const maxBytes = options.maxBytes ?? 64 * 1024 * 1024;
    integer(maxBytes, 'maxBytes', 1);
    const response = await (options.fetch ?? globalThis.fetch)(parsed, options.request);
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Snapshot HTTP ${response.status}`); }
    const declared = response.headers.get('content-length');
    if (declared !== null && Number(declared) > maxBytes) { await response.body?.cancel(); throw new RangeError('Snapshot exceeds maxBytes'); }
    if (!response.body) throw new TypeError('Empty snapshot response');
    const reader = response.body.getReader(), decoder = new TextDecoder('utf-8', { fatal: true });
    let size = 0, text = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) throw new RangeError('Snapshot exceeds maxBytes');
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } catch (error) { try { await reader.cancel(); } catch { /* Preserve the decoding/size/transport error. */ } throw error; }
    finally { reader.releaseLock(); }
    return LexicalSearch.fromJSON<M>(text, options.analyzers);
  }

}
