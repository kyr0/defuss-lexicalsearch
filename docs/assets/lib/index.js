import { c as createAnalyzer, u as unicodeAnalyzer, b as analyze, p as primaryLanguage, d as builtinAnalyzers, e as codeAnalyzer, k as keywordAnalyzer } from './analyzer-CQNufUmw.js';
export { f as accentFoldedAnalyzer, g as foldedKeywordAnalyzer, n as normalizeToken, a as tokenize, h as whitespaceAnalyzer } from './analyzer-CQNufUmw.js';

function parseQuery(query) {
  const free = [], phrases = [];
  let quoted = false, part = "", literal = "";
  const flush = () => {
    if (quoted) {
      if (part.length) phrases.push(part);
    } else free.push(...part.split(/\s+/u).filter(Boolean));
    part = "";
  };
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (char === "\\" && (query[i + 1] === '"' || query[i + 1] === "\\")) {
      const escaped = query[++i];
      part += escaped;
      literal += escaped;
    } else if (char === '"') {
      flush();
      quoted = !quoted;
    } else {
      part += char;
      literal += char;
    }
  }
  if (quoted) throw new SyntaxError("Unclosed phrase quote");
  flush();
  if (free.length + phrases.length > 128) throw new RangeError("Query exceeds 128 clauses");
  return { free: [...new Set(free)], phrases: [...new Set(phrases)], literal };
}

function bm25(tf, df, n, length, average, k1, b) {
  if (tf === 0 || n === 0 || average === 0) return 0;
  const idf = Math.log1p((n - df + 0.5) / (df + 0.5));
  return idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * length / average));
}
function bm25Scorer(df, n, average, k1, b, weight) {
  if (!n || !average) return () => 0;
  const scale = weight * Math.log1p((n - df + 0.5) / (df + 0.5)) * (k1 + 1);
  const constant = k1 * (1 - b), lengthScale = k1 * b / average;
  return (tf, length) => tf ? scale * tf / (tf + constant + lengthScale * length) : 0;
}

class TopK {
  constructor(capacity, compare) {
    this.capacity = capacity;
    this.compare = compare;
  }
  capacity;
  compare;
  items = [];
  add(item) {
    if (this.capacity === 0) return;
    if (this.items.length < this.capacity) {
      let i = this.items.push(item) - 1;
      while (i > 0) {
        const parent = i - 1 >> 1;
        if (this.compare(this.items[i], this.items[parent]) <= 0) break;
        [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
        i = parent;
      }
    } else if (this.compare(item, this.items[0]) < 0) {
      this.items[0] = item;
      let i = 0;
      while (2 * i + 1 < this.items.length) {
        let worse = 2 * i + 1;
        if (worse + 1 < this.items.length && this.compare(this.items[worse + 1], this.items[worse]) > 0) worse++;
        if (this.compare(this.items[worse], this.items[i]) <= 0) break;
        [this.items[i], this.items[worse]] = [this.items[worse], this.items[i]];
        i = worse;
      }
    }
  }
  sorted() {
    return this.items.sort(this.compare);
  }
}

const node = () => ({ terminal: false, children: /* @__PURE__ */ new Map() });
class Vocabulary {
  root = node();
  terms = /* @__PURE__ */ new Set();
  reversed;
  grams;
  trigrams(term) {
    const chars = Array.from(term), result = /* @__PURE__ */ new Set();
    for (let i = 0; i + 2 < chars.length; i++) result.add(chars.slice(i, i + 3).join(""));
    return result;
  }
  indexGrams(term) {
    for (const gram of this.trigrams(term)) {
      let set = this.grams.get(gram);
      if (!set) {
        set = /* @__PURE__ */ new Set();
        this.grams.set(gram, set);
      }
      set.add(term);
    }
  }
  suffix(value) {
    if (!this.reversed) {
      this.reversed = new Vocabulary();
      for (const term of this.terms) this.reversed.add(Array.from(term).reverse().join(""));
    }
    return this.reversed.prefix(Array.from(value).reverse().join("")).map((term) => Array.from(term).reverse().join("")).sort();
  }
  substring(value) {
    const grams = [...this.trigrams(value)];
    if (!grams.length) return [...this.terms].filter((term) => term.includes(value)).sort();
    if (!this.grams) {
      this.grams = /* @__PURE__ */ new Map();
      for (const term of this.terms) this.indexGrams(term);
    }
    const sets = grams.map((gram) => this.grams.get(gram));
    if (sets.some((set) => !set)) return [];
    sets.sort((a, b) => a.size - b.size);
    return [...sets[0]].filter((term) => sets.every((set) => set.has(term)) && term.includes(value)).sort();
  }
  add(term) {
    if (this.terms.has(term)) return;
    this.terms.add(term);
    this.reversed?.add(Array.from(term).reverse().join(""));
    if (this.grams) this.indexGrams(term);
    let current = this.root;
    for (const char of term) {
      let next = current.children.get(char);
      if (!next) {
        next = node();
        current.children.set(char, next);
      }
      current = next;
    }
    current.terminal = true;
  }
  delete(term) {
    if (!this.terms.delete(term)) return;
    this.reversed?.delete(Array.from(term).reverse().join(""));
    if (this.grams) for (const gram of this.trigrams(term)) {
      const set = this.grams.get(gram);
      set.delete(term);
      if (!set.size) this.grams.delete(gram);
    }
    let current = this.root;
    const path = [];
    for (const char of term) {
      const next = current.children.get(char);
      if (!next) return;
      path.push([current, char]);
      current = next;
    }
    current.terminal = false;
    for (let i = path.length - 1; i >= 0 && !current.terminal && current.children.size === 0; i--) {
      const [parent, char] = path[i];
      parent.children.delete(char);
      current = parent;
    }
  }
  prefix(prefix) {
    let current = this.root;
    for (const char of prefix) {
      const next = current.children.get(char);
      if (!next) return [];
      current = next;
    }
    const result = [];
    const stack = [[current, prefix]];
    while (stack.length) {
      const [n, term] = stack.pop();
      if (n.terminal) result.push(term);
      for (const [char, child] of n.children) stack.push([child, term + char]);
    }
    return result.sort();
  }
  /**
   * Terms within `distance` edits of `query`; with `completion`, also terms that start with such a string, at the
   * distance of their closest prefix. Why carry the best prefix distance down the path instead of a second walk: each
   * DP row already holds the distance from the query to that node's prefix, so one walk answers both questions.
   * VERIFIED: test/oracles.test.mjs compares both modes with an exhaustive oracle, with and without transpositions.
   */
  fuzzy(query, distance, transpositions = false, completion = false) {
    const chars = Array.from(query);
    const initial = Array.from({ length: chars.length + 1 }, (_, i) => i);
    const stack = [[this.root, "", initial, void 0, "", completion ? chars.length : Infinity]];
    const result = [];
    while (stack.length) {
      const [n, prefix, previous, beforePrevious, previousChar, best] = stack.pop();
      for (const [char, child] of n.children) {
        const row = [previous[0] + 1];
        let minimum = row[0];
        for (let i = 1; i <= chars.length; i++) {
          row[i] = Math.min(row[i - 1] + 1, previous[i] + 1, previous[i - 1] + (chars[i - 1] === char ? 0 : 1));
          if (transpositions && beforePrevious && i > 1 && char === chars[i - 2] && previousChar === chars[i - 1]) {
            row[i] = Math.min(row[i], beforePrevious[i - 2] + 1);
          }
          minimum = Math.min(minimum, row[i]);
        }
        const term = prefix + char, whole = row[chars.length], closest = completion ? Math.min(best, whole) : whole;
        if (child.terminal && closest <= distance) result.push({ term, distance: closest, completion: whole > closest });
        if (minimum <= distance || closest <= distance) stack.push([child, term, row, previous, char, closest]);
      }
    }
    return result.sort((a, b) => a.distance - b.distance || compareString(a.term, b.term));
  }
}
const compareString = (a, b) => a < b ? -1 : a > b ? 1 : 0;

function integer(value, name, min, max = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer in [${min}, ${max}]`);
  }
}
function record(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function id(value) {
  if (typeof value !== "string" || !value) throw new TypeError("Document id must be a nonempty string");
}
function ownJson(value) {
  const active = /* @__PURE__ */ new Set();
  const visit = (v, depth) => {
    if (depth > 100) throw new RangeError("Metadata nesting exceeds 100");
    if (v === null || typeof v === "string" || typeof v === "boolean") return;
    if (typeof v === "number" && Number.isFinite(v)) return;
    if (!Array.isArray(v) && !record(v)) throw new TypeError("Metadata must be losslessly JSON-serializable");
    if (active.has(v)) throw new TypeError("Metadata must not be cyclic");
    active.add(v);
    if (Array.isArray(v)) {
      if (Reflect.ownKeys(v).length !== v.length + 1) throw new TypeError("Metadata arrays must be dense and have no extra properties");
      for (let i = 0; i < v.length; i++) {
        const descriptor = Object.getOwnPropertyDescriptor(v, String(i));
        if (!descriptor || descriptor.get) throw new TypeError("Metadata array accessors/holes are not supported");
        visit(v[i], depth + 1);
      }
    } else {
      for (const key of Reflect.ownKeys(v)) {
        if (typeof key !== "string" || !Object.getOwnPropertyDescriptor(v, key)?.enumerable) throw new TypeError("Metadata keys must be enumerable strings");
        if (Object.getOwnPropertyDescriptor(v, key)?.get) throw new TypeError("Metadata getters are not supported");
        visit(v[key], depth + 1);
      }
    }
    active.delete(v);
  };
  visit(value, 0);
  const copy = JSON.parse(JSON.stringify(value));
  const freeze = (v) => {
    if (v !== null && typeof v === "object") {
      Object.values(v).forEach(freeze);
      Object.freeze(v);
    }
  };
  freeze(copy);
  return copy;
}

const tiers = ["incomplete", "fuzzy", "partial", "term", "identifier-prefix", "keyword", "literal"];
class LexicalSearch {
  analyzer;
  fields = /* @__PURE__ */ new Map();
  documents = /* @__PURE__ */ new Map();
  termFields = /* @__PURE__ */ new Map();
  ranking;
  k1;
  maxDocuments;
  maxTokenLength;
  busy = false;
  constructor(options = {}) {
    if (!record(options)) throw new TypeError("Options must be an object");
    this.analyzer = createAnalyzer(options.analyzer ?? unicodeAnalyzer);
    this.ranking = options.ranking ?? "relevance";
    if (!["relevance", "exact-first"].includes(this.ranking)) throw new TypeError("Invalid ranking");
    this.k1 = options.k1 ?? 1.2;
    if (!Number.isFinite(this.k1) || this.k1 < 0 || this.k1 > 1e3) throw new RangeError("k1 must be in [0, 1000]");
    this.maxDocuments = options.maxDocuments ?? 1e5;
    integer(this.maxDocuments, "maxDocuments", 1);
    this.maxTokenLength = options.maxTokenLength ?? 128;
    integer(this.maxTokenLength, "maxTokenLength", 1, 4096);
    const analyzerIds = /* @__PURE__ */ new Map([[this.analyzer.id, this.analyzer]]);
    const schema = options.fields ?? { text: {} };
    if (!record(schema) || !Object.keys(schema).length) throw new TypeError("At least one field is required");
    for (const name of Object.keys(schema).sort()) {
      if (!name || !record(schema[name])) throw new TypeError("Invalid field configuration");
      const { weight = 1, b = 0.75 } = schema[name];
      if (!Number.isFinite(weight) || weight <= 0 || weight > 1e6) throw new RangeError("Field weight must be in (0, 1000000]");
      if (!Number.isFinite(b) || b < 0 || b > 1) throw new RangeError("Field b must be in [0, 1]");
      const analyzer = createAnalyzer(schema[name].analyzer ?? this.analyzer);
      const previousAnalyzer = analyzerIds.get(analyzer.id);
      if (previousAnalyzer && (previousAnalyzer.tokenize !== analyzer.tokenize || previousAnalyzer.normalize !== analyzer.normalize || previousAnalyzer.stem !== analyzer.stem || previousAnalyzer.phonetic !== analyzer.phonetic || previousAnalyzer.kind !== analyzer.kind || previousAnalyzer.segmented !== analyzer.segmented || previousAnalyzer.language !== analyzer.language || JSON.stringify(previousAnalyzer.stopWords) !== JSON.stringify(analyzer.stopWords))) {
        throw new TypeError(`Conflicting analyzer definitions for id ${analyzer.id}`);
      }
      analyzerIds.set(analyzer.id, analyzer);
      const source = schema[name].source;
      if (source !== void 0 && (typeof source !== "string" || !Object.hasOwn(schema, source) || source === name || schema[source].source !== void 0)) {
        throw new TypeError("Derived field source must name a configured non-derived field");
      }
      this.fields.set(name, {
        weight,
        b,
        analyzer,
        source,
        stopWords: new Set((analyzer.stopWords ?? []).flatMap((word) => analyze(word, analyzer, this.maxTokenLength))),
        vocabulary: new Vocabulary(),
        raw: /* @__PURE__ */ new Map(),
        documents: 0,
        tokens: 0,
        postings: /* @__PURE__ */ new Map()
      });
    }
  }
  get size() {
    return this.documents.size;
  }
  has(id) {
    return this.documents.has(id);
  }
  /** Returns an owned JSON copy, never mutable internal state. */
  get(id) {
    const stored = this.documents.get(id);
    return stored ? JSON.parse(JSON.stringify(stored.document)) : void 0;
  }
  exclusive(fn) {
    if (this.busy) throw new Error("Reentrant search or mutation is not supported");
    this.busy = true;
    try {
      return fn();
    } finally {
      this.busy = false;
    }
  }
  prepare(input) {
    if (!record(input)) throw new TypeError("Document must be an object");
    const id$1 = input.id;
    id(id$1);
    if (!record(input.fields)) throw new TypeError("Document fields must be an object");
    const values = [];
    const fields = /* @__PURE__ */ new Map();
    for (const name of Object.keys(input.fields).sort()) {
      const config = this.fields.get(name);
      if (!config) throw new TypeError(`Unknown field: ${name}`);
      if (config.source) throw new TypeError(`Derived field ${name} is populated from ${config.source}`);
      const text = input.fields[name];
      if (typeof text !== "string") throw new TypeError(`Field ${name} must be a string`);
      values.push([name, text]);
    }
    const document = { id: id$1, fields: Object.fromEntries(values) };
    if (input.metadata !== void 0) document.metadata = ownJson(input.metadata);
    for (const [name, config] of this.fields) {
      const source = config.source ?? name;
      if (!Object.hasOwn(document.fields, source)) continue;
      const text = document.fields[source];
      const tokens = analyze(text, config.analyzer, this.maxTokenLength);
      const positions = /* @__PURE__ */ new Map();
      tokens.forEach((term, position) => {
        const existing = positions.get(term);
        if (existing) existing.push(position);
        else positions.set(term, [position]);
      });
      fields.set(name, { text, tokens, positions });
    }
    return { document, fields };
  }
  /** All-or-nothing validation; duplicate IDs are rejected, including within a batch. */
  addAll(inputs) {
    this.exclusive(() => {
      if (!Array.isArray(inputs)) throw new TypeError("addAll requires an array");
      if (inputs.length > this.maxDocuments - this.size) throw new RangeError("Document capacity exceeded");
      const ids = /* @__PURE__ */ new Set();
      const prepared = inputs.map((input) => {
        const stored = this.prepare(input), id = stored.document.id;
        if (this.documents.has(id) || ids.has(id)) throw new Error(`Duplicate document id: ${id}`);
        ids.add(id);
        return stored;
      });
      prepared.forEach((item) => this.insert(item));
    });
  }
  add(input) {
    this.addAll([input]);
  }
  /** Atomic replacement: validate and analyze completely before removing old postings. */
  upsert(input) {
    this.exclusive(() => {
      const prepared = this.prepare(input);
      if (!this.documents.has(prepared.document.id) && this.size >= this.maxDocuments) throw new RangeError("Document capacity exceeded");
      this.erase(prepared.document.id);
      this.insert(prepared);
    });
  }
  insert(stored) {
    const id = stored.document.id;
    this.documents.set(id, stored);
    for (const [name, value] of stored.fields) {
      const field = this.fields.get(name);
      let rawIds = field.raw.get(value.text);
      if (!rawIds) {
        rawIds = /* @__PURE__ */ new Set();
        field.raw.set(value.text, rawIds);
      }
      rawIds.add(id);
      if (value.tokens.length) field.documents++;
      field.tokens += value.tokens.length;
      for (const [term, positions] of value.positions) {
        let posting = field.postings.get(term);
        if (!posting) {
          posting = /* @__PURE__ */ new Map();
          field.postings.set(term, posting);
          this.termFields.set(term, (this.termFields.get(term) ?? 0) + 1);
          field.vocabulary.add(term);
        }
        posting.set(id, positions);
      }
    }
  }
  remove(id$1) {
    return this.exclusive(() => {
      id(id$1);
      return this.erase(id$1);
    });
  }
  erase(id) {
    const stored = this.documents.get(id);
    if (!stored) return false;
    for (const [name, value] of stored.fields) {
      const field = this.fields.get(name);
      const rawIds = field.raw.get(value.text);
      rawIds.delete(id);
      if (!rawIds.size) field.raw.delete(value.text);
      if (value.tokens.length) field.documents--;
      field.tokens -= value.tokens.length;
      for (const term of value.positions.keys()) {
        const posting = field.postings.get(term);
        posting.delete(id);
        if (posting.size === 0) {
          field.postings.delete(term);
          field.vocabulary.delete(term);
          const count = this.termFields.get(term) - 1;
          if (count) this.termFields.set(term, count);
          else this.termFields.delete(term);
        }
      }
    }
    this.documents.delete(id);
    return true;
  }
  clear() {
    this.exclusive(() => {
      this.documents.clear();
      this.termFields.clear();
      for (const field of this.fields.values()) {
        field.documents = 0;
        field.tokens = 0;
        field.postings.clear();
        field.raw.clear();
        field.vocabulary = new Vocabulary();
      }
    });
  }
  stats() {
    return {
      documents: this.size,
      terms: this.termFields.size,
      fields: Object.fromEntries(Array.from(this.fields, ([name, field]) => [name, {
        documents: field.documents,
        tokens: field.tokens,
        averageLength: field.documents ? field.tokens / field.documents : 0
      }]))
    };
  }
  search(query, options = {}) {
    return this.searchWithStats(query, options).hits;
  }
  searchWithStats(query, options = {}) {
    return this.exclusive(() => this.retrieve(query, options));
  }
  retrieve(query, options) {
    if (typeof query !== "string" || query.length > 16384) throw new TypeError("Query must be a string of at most 16384 UTF-16 units");
    if (!record(options)) throw new TypeError("Search options must be an object");
    const { limit = 10, offset = 0, operator = "any", mode = "lexical", ranking = this.ranking, caseSensitive = true } = options;
    integer(limit, "limit", 0);
    integer(offset, "offset", 0);
    if (!["any", "all"].includes(operator)) throw new TypeError("operator must be any or all");
    if (!["lexical", "exact", "prefix", "suffix", "substring"].includes(mode)) throw new TypeError("Invalid mode");
    if (!["relevance", "exact-first"].includes(ranking)) throw new TypeError("Invalid ranking");
    if (![false, true, 0, 1, 2].includes(options.fuzzy ?? false)) throw new TypeError("fuzzy must be boolean, 0, 1 or 2");
    for (const flag of [
      caseSensitive,
      options.prefix ?? false,
      options.suffix ?? false,
      options.substring ?? false,
      options.transpositions ?? false,
      options.phonetic ?? false,
      options.explain ?? false
    ]) if (typeof flag !== "boolean") throw new TypeError("Search flags must be boolean");
    if (options.filter !== void 0 && typeof options.filter !== "function") throw new TypeError("filter must be a function");
    if (options.ids !== void 0 && !(options.ids instanceof Set)) throw new TypeError("ids must be a Set");
    if (options.fields !== void 0 && !Array.isArray(options.fields)) throw new TypeError("fields must be an array");
    if (options.exclude !== void 0 && (!Array.isArray(options.exclude) || options.exclude.length > 32 || options.exclude.some((s) => typeof s !== "string"))) throw new TypeError("exclude requires at most 32 query strings");
    if (mode !== "lexical" && (options.prefix || options.suffix || options.substring || options.fuzzy || options.phonetic)) throw new TypeError("Literal modes cannot use lexical expansions");
    const names = options.fields ? [...new Set(options.fields)].sort() : [...this.fields.keys()];
    for (const name of names) if (!this.fields.has(name)) throw new TypeError(`Unknown search field: ${name}`);
    if (options.language !== void 0 && typeof options.language !== "string") throw new TypeError("language must be a string");
    const language = options.language === void 0 ? void 0 : primaryLanguage(options.language);
    const languageBoost = options.languageBoost ?? 3;
    if (typeof languageBoost !== "number" || !Number.isFinite(languageBoost) || languageBoost < 1 || languageBoost > 1e6) throw new RangeError("languageBoost must be in [1, 1000000]");
    const weightOf = (field) => language !== void 0 && field.analyzer.language === language ? field.weight * languageBoost : field.weight;
    const stats = { expandedTerms: 0, postingsVisited: 0, candidatesScored: 0 };
    const excluded = /* @__PURE__ */ new Set();
    for (const negative of options.exclude ?? []) {
      const response = this.retrieve(negative, { ...options, exclude: void 0, filter: void 0, limit: this.size, offset: 0, explain: false });
      response.hits.forEach((hit) => excluded.add(hit.id));
      stats.expandedTerms += response.stats.expandedTerms;
      stats.postingsVisited += response.stats.postingsVisited;
    }
    const accepted = /* @__PURE__ */ new Map();
    const accepts = (id) => {
      let ok = accepted.get(id);
      if (ok === void 0) {
        ok = !excluded.has(id) && (!options.ids || options.ids.has(id)) && (!options.filter || !!options.filter(this.documents.get(id).document.metadata, id));
        accepted.set(id, ok);
      }
      return ok;
    };
    const compare = (a, b) => (ranking === "exact-first" ? b.quality - a.quality : 0) || b.score - a.score || compareString(a.id, b.id);
    const top = new TopK(limit === 0 ? 0 : Math.min(this.size, offset + Math.min(this.size, limit)), compare);
    let total = 0;
    const emit = (candidate) => {
      total++;
      stats.candidatesScored++;
      top.add(candidate);
    };
    const finish = () => ({ total, stats, hits: top.sorted().slice(offset, offset + limit).map((candidate, i) => {
      const result = { id: candidate.id, rank: offset + i + 1, score: candidate.score };
      const metadata = this.documents.get(candidate.id).document.metadata;
      if (metadata !== void 0) result.metadata = JSON.parse(JSON.stringify(metadata));
      if (options.explain) result.matches = candidate.matches;
      if (ranking === "exact-first") result.tier = tiers[candidate.quality];
      return result;
    }) });
    if (mode !== "lexical") {
      if (!query.length || !names.length) return finish();
      const needle = caseSensitive ? query : query.toLowerCase();
      const candidates2 = /* @__PURE__ */ new Map();
      for (const name of names) {
        const field = this.fields.get(name);
        const add = (id, text) => {
          stats.postingsVisited++;
          if (!accepts(id)) return;
          let candidate = candidates2.get(id);
          if (!candidate) {
            candidate = { id, score: 0, quality: mode === "exact" ? 6 : mode === "substring" ? 2 : 4, matches: [] };
            candidates2.set(id, candidate);
          }
          candidate.score += weightOf(field);
          if (options.explain) candidate.matches.push({ query, term: text, field: name, kind: "literal", distance: 0, score: weightOf(field) });
        };
        if (mode === "exact" && caseSensitive) {
          const matches = field.raw.get(query);
          if (matches) {
            const probes = options.ids && options.ids.size < matches.size ? [...options.ids].filter((id) => matches.has(id)) : matches;
            for (const id of probes) add(id, query);
          }
        } else {
          const entries = options.ids ? Array.from(options.ids, (id) => [id, this.documents.get(id)]) : this.documents;
          for (const [id, stored] of entries) {
            const text = stored?.fields.get(name)?.text;
            if (text === void 0) continue;
            const value = caseSensitive ? text : text.toLowerCase();
            const matches = mode === "exact" ? value === needle : mode === "prefix" ? value.startsWith(needle) : mode === "suffix" ? value.endsWith(needle) : value.includes(needle);
            if (matches) add(id, text);
            else stats.postingsVisited++;
          }
        }
      }
      for (const candidate of candidates2.values()) emit(candidate);
      return finish();
    }
    const parsed = parseQuery(query);
    const clauses = [];
    const scorePlans = /* @__PURE__ */ new Map();
    const tokenCounts = /* @__PURE__ */ new Map();
    const addClause = (raw, phrase, last) => {
      const fields = [];
      for (const name of names) {
        const field = this.fields.get(name);
        const variants = !phrase && parsed.free.length > 1 && !parsed.phrases.length && field.analyzer.kind === "keyword" ? [raw, parsed.literal] : [raw];
        for (const variant of variants) {
          const analyzed = analyze(variant, field.analyzer);
          const count = (tokenCounts.get(name) ?? 0) + analyzed.length;
          tokenCounts.set(name, count);
          if (count > 128) throw new RangeError("Query exceeds 128 analyzed tokens per field");
          const tokens = phrase ? analyzed : analyzed.filter((term) => !field.stopWords.has(term));
          if (!tokens.length) continue;
          const expansions = /* @__PURE__ */ new Map();
          for (const term of [...new Set(tokens)].sort()) {
            const list = this.expand(field, term, phrase ? {} : { ...options, prefix: !!options.prefix && last && term === tokens.at(-1) });
            expansions.set(term, list);
            let fieldPlans = scorePlans.get(name);
            if (!fieldPlans) {
              fieldPlans = /* @__PURE__ */ new Map();
              scorePlans.set(name, fieldPlans);
            }
            const previous = fieldPlans.get(term);
            if (!previous || list.length > previous.length) fieldPlans.set(term, list);
          }
          fields.push({ name, tokens, expansions });
        }
      }
      if (fields.length) clauses.push({ key: clauses.length, phrase, fields, cost: 0 });
    };
    parsed.free.forEach((raw, i) => addClause(raw, false, i === parsed.free.length - 1));
    parsed.phrases.forEach((raw) => addClause(raw, true, false));
    if (!clauses.length || !this.size || !names.length) return finish();
    for (const plan of scorePlans.values()) for (const list of plan.values()) stats.expandedTerms += list.length;
    const lists = (field, expansions) => expansions.flatMap((e) => {
      const posting = field.postings.get(e.term);
      return posting ? [posting] : [];
    });
    for (const clause of clauses) clause.cost = clause.fields.reduce((sum, fp) => sum + Math.min(...[...fp.expansions.values()].map((expansions) => lists(this.fields.get(fp.name), expansions).reduce((n, p) => n + p.size, 0))), 0);
    const literalQuery = parsed.literal;
    const literal = (id) => names.some((name) => {
      const text = this.documents.get(id).fields.get(name)?.text;
      return text !== void 0 && (caseSensitive ? text === literalQuery : text.toLowerCase() === literalQuery.toLowerCase());
    });
    const quality = (field, kind) => kind === "exact" ? field.analyzer.kind === "keyword" ? 5 : 3 : kind === "prefix" || kind === "suffix" ? field.analyzer.kind === "keyword" ? 4 : 2 : kind === "substring" ? 2 : 1;
    if (clauses.length === 1 && !clauses[0].phrase && clauses[0].fields.every((fp) => fp.tokens.length === 1)) {
      const active = clauses[0].fields.flatMap((fp) => [...fp.expansions].flatMap(([term, exps]) => exps.flatMap((exp) => this.fields.get(fp.name).postings.has(exp.term) ? [{ name: fp.name, term, exp }] : [])));
      if (active.length === 1) {
        const { name, term, exp } = active[0], field = this.fields.get(name), posting = field.postings.get(exp.term);
        const score = bm25Scorer(posting.size, field.documents, field.tokens / field.documents, this.k1, field.b, exp.weight * weightOf(field));
        const noMatches = [];
        for (const [id, positions] of this.entries(posting, options.ids)) {
          stats.postingsVisited++;
          const stored = this.documents.get(id);
          if (excluded.has(id) || options.filter && !options.filter(stored.document.metadata, id)) continue;
          const value = score(positions.length, stored.fields.get(name).tokens.length);
          emit({
            id,
            score: value,
            quality: ranking === "exact-first" ? literal(id) ? 6 : quality(field, exp.kind) : 0,
            matches: options.explain ? [{ query: term, term: exp.term, field: name, kind: exp.kind, distance: exp.distance, score: value }] : noMatches
          });
        }
        return finish();
      }
    }
    const matchField = (fp, phrase, allowed2) => {
      const field = this.fields.get(fp.name);
      const groups = [...fp.expansions.values()].map((expansions) => lists(field, expansions)).sort((a, b) => a.reduce((n, p) => n + p.size, 0) - b.reduce((n, p) => n + p.size, 0));
      const found = /* @__PURE__ */ new Set();
      const anyToken = !phrase && operator === "any" && !!field.analyzer.segmented;
      for (const posting of anyToken ? groups.flat() : groups[0]) for (const [id] of this.entries(posting, allowed2)) {
        stats.postingsVisited++;
        if (found.has(id) || !accepts(id) || !anyToken && !groups.every((group) => group.some((p) => p.has(id)))) continue;
        if (phrase) {
          const stored = this.documents.get(id).fields.get(fp.name);
          let anchor = 0;
          for (let i = 1; i < fp.tokens.length; i++) if (stored.positions.get(fp.tokens[i]).length < stored.positions.get(fp.tokens[anchor]).length) anchor = i;
          if (!stored.positions.get(fp.tokens[anchor]).some((position) => {
            const start = position - anchor;
            return start >= 0 && fp.tokens.every((term, i) => stored.tokens[start + i] === term);
          })) continue;
        }
        found.add(id);
      }
      return found;
    };
    const free = clauses.filter((c) => !c.phrase), phrases = clauses.filter((c) => c.phrase);
    const units = [...operator === "all" ? free.map((c) => [c]) : free.length ? [free] : [], ...phrases.map((c) => [c])];
    units.sort((a, b) => a.reduce((n, c) => n + c.cost, 0) - b.reduce((n, c) => n + c.cost, 0));
    let allowed = options.ids;
    for (const unit of units) {
      const found = /* @__PURE__ */ new Set();
      for (const clause of unit) for (const fp of clause.fields) for (const id of matchField(fp, clause.phrase, allowed)) found.add(id);
      allowed = found;
      if (!allowed.size) return finish();
    }
    const candidates = /* @__PURE__ */ new Map();
    const bestQuality = /* @__PURE__ */ new Map();
    for (const name of names) {
      const field = this.fields.get(name), plans = scorePlans.get(name);
      if (!plans) continue;
      for (const [term, expansions] of [...plans].sort(([a], [b]) => compareString(a, b))) {
        const best = /* @__PURE__ */ new Map();
        for (const exp of expansions) {
          const posting = field.postings.get(exp.term);
          if (!posting) continue;
          const scorer = bm25Scorer(posting.size, field.documents, field.tokens / field.documents, this.k1, field.b, exp.weight * weightOf(field));
          for (const [id, positions] of this.entries(posting, allowed)) {
            stats.postingsVisited++;
            const score = scorer(positions.length, this.documents.get(id).fields.get(name).tokens.length);
            const previous = best.get(id);
            const q = quality(field, exp.kind), pq = previous ? quality(field, previous.kind) : -1;
            if (!previous || (ranking === "exact-first" && q !== pq ? q > pq : score > previous.score)) {
              best.set(id, { query: term, term: exp.term, field: name, kind: exp.kind, distance: exp.distance, score });
            }
            if (ranking === "exact-first") {
              let byField = bestQuality.get(id);
              if (!byField) {
                byField = /* @__PURE__ */ new Map();
                bestQuality.set(id, byField);
              }
              let byTerm = byField.get(name);
              if (!byTerm) {
                byTerm = /* @__PURE__ */ new Map();
                byField.set(name, byTerm);
              }
              byTerm.set(term, Math.max(byTerm.get(term) ?? 0, q));
            }
          }
        }
        for (const [id, match] of best) {
          let candidate = candidates.get(id);
          if (!candidate) {
            candidate = { id, score: 0, quality: 0, matches: [] };
            candidates.set(id, candidate);
          }
          candidate.score += match.score;
          if (options.explain) candidate.matches.push(match);
        }
      }
    }
    for (const candidate of candidates.values()) {
      if (ranking === "exact-first") candidate.quality = literal(candidate.id) ? 6 : Math.min(...clauses.map((clause) => Math.max(...clause.fields.map((fp) => Math.min(...fp.tokens.map((term) => bestQuality.get(candidate.id)?.get(fp.name)?.get(term) ?? 0))))));
      emit(candidate);
    }
    return finish();
  }
  *entries(posting, ids) {
    if (ids && ids.size < posting.size) {
      for (const id of ids) {
        const positions = posting.get(id);
        if (positions) yield [id, positions];
      }
    } else for (const entry of posting) if (!ids || ids.has(entry[0])) yield entry;
  }
  expand(field, query, options) {
    const found = /* @__PURE__ */ new Map();
    found.set(query, { term: query, kind: "exact", distance: 0, weight: 1 });
    const add = (terms, kind, weight) => {
      for (const term of terms) if (!found.has(term)) found.set(term, { term, kind, distance: 0, weight });
    };
    if (options.prefix) add(field.vocabulary.prefix(query), "prefix", 0.8);
    if (options.suffix) add(field.vocabulary.suffix(query), "suffix", 0.75);
    if (options.substring) add(field.vocabulary.substring(query), "substring", 0.65);
    const length = Array.from(query).length;
    const radius = options.fuzzy === true ? length >= 6 ? 2 : length >= 3 ? 1 : 0 : Number(options.fuzzy ?? 0);
    if (radius > 0) {
      const code = options.phonetic && field.analyzer.phonetic ? field.analyzer.phonetic(query) : "";
      for (const neighbor of field.vocabulary.fuzzy(query, radius, options.transpositions, !!options.prefix)) {
        if (found.has(neighbor.term)) continue;
        const boost = code && field.analyzer.phonetic?.(neighbor.term) === code ? 1.1 : 1;
        const weight = 0.55 * boost * (neighbor.completion ? 0.8 : 1) / neighbor.distance;
        found.set(neighbor.term, { term: neighbor.term, distance: neighbor.distance, kind: "fuzzy", weight });
      }
    }
    return [...found.values()].sort((a, b) => b.weight - a.weight || compareString(a.term, b.term));
  }
  toJSON() {
    return {
      format: "defuss-lexicalsearch",
      version: 2,
      analyzer: this.analyzer.id,
      options: {
        fields: Object.fromEntries(Array.from(this.fields, ([name, field]) => [name, {
          weight: field.weight,
          b: field.b,
          analyzer: field.analyzer.id,
          ...field.source ? { source: field.source } : {}
        }])),
        k1: this.k1,
        maxDocuments: this.maxDocuments,
        maxTokenLength: this.maxTokenLength,
        ranking: this.ranking
      },
      documents: [...this.documents.keys()].sort(compareString).map((id) => this.get(id))
    };
  }
  serialize() {
    return JSON.stringify(this.toJSON());
  }
  /** Rebuild all derived state from a version 2 snapshot; analyzers resolve by id. VERIFIED: any other format or version throws before an index is built. */
  static fromJSON(input, analyzers) {
    const value = typeof input === "string" ? JSON.parse(input) : input;
    if (!record(value) || value.format !== "defuss-lexicalsearch" || value.version !== 2) throw new TypeError("Unsupported snapshot format/version");
    if (!record(value.options) || !record(value.options.fields) || !Array.isArray(value.documents)) throw new TypeError("Invalid snapshot");
    const registry = Object.assign(/* @__PURE__ */ Object.create(null), builtinAnalyzers);
    if (analyzers !== void 0) {
      if (!record(analyzers)) throw new TypeError("Invalid analyzer registry");
      if (typeof analyzers.id === "string" && typeof analyzers.tokenize === "function") {
        const analyzer2 = createAnalyzer(analyzers);
        registry[analyzer2.id] = analyzer2;
      } else for (const [id, config] of Object.entries(analyzers)) {
        const analyzer2 = createAnalyzer(config);
        if (id !== analyzer2.id) throw new Error("analyzer mismatch: registry key must equal analyzer id");
        registry[id] = analyzer2;
      }
    }
    const resolve = (id) => {
      if (typeof id !== "string" || !registry[id]) throw new Error(`Snapshot analyzer mismatch: missing ${String(id)}`);
      return registry[id];
    };
    const analyzer = resolve(value.analyzer);
    for (const key of ["k1", "maxDocuments", "maxTokenLength"]) if (typeof value.options[key] !== "number") throw new TypeError(`Missing snapshot option: ${key}`);
    const fields = Object.fromEntries(Object.entries(value.options.fields).map(([name, field]) => {
      if (!record(field) || typeof field.weight !== "number" || typeof field.b !== "number") throw new TypeError("Invalid snapshot field");
      if (field.source !== void 0 && typeof field.source !== "string") throw new TypeError("Invalid field source");
      return [name, { weight: field.weight, b: field.b, analyzer: resolve(field.analyzer), source: field.source }];
    }));
    if (!["relevance", "exact-first"].includes(value.options.ranking)) throw new TypeError("Invalid snapshot ranking");
    const index = new LexicalSearch({
      fields,
      analyzer,
      k1: value.options.k1,
      maxDocuments: value.options.maxDocuments,
      maxTokenLength: value.options.maxTokenLength,
      ranking: value.options.ranking
    });
    index.addAll(value.documents);
    return index;
  }
  /** Explicit network access only. Bound response size and validate before exposing an index. */
  static async fromURL(url, options = {}) {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new TypeError("Snapshot URL must use HTTP(S)");
    const maxBytes = options.maxBytes ?? 64 * 1024 * 1024;
    integer(maxBytes, "maxBytes", 1);
    const response = await (options.fetch ?? globalThis.fetch)(parsed, options.request);
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Snapshot HTTP ${response.status}`);
    }
    const declared = response.headers.get("content-length");
    if (declared !== null && Number(declared) > maxBytes) {
      await response.body?.cancel();
      throw new RangeError("Snapshot exceeds maxBytes");
    }
    if (!response.body) throw new TypeError("Empty snapshot response");
    const reader = response.body.getReader(), decoder = new TextDecoder("utf-8", { fatal: true });
    let size = 0, text = "";
    try {
      for (; ; ) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) throw new RangeError("Snapshot exceeds maxBytes");
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } catch (error) {
      try {
        await reader.cancel();
      } catch {
      }
      throw error;
    } finally {
      reader.releaseLock();
    }
    return LexicalSearch.fromJSON(text, options.analyzers);
  }
}

const apiSearchPreset = Object.freeze({
  ranking: "exact-first",
  maxTokenLength: 1024,
  fields: Object.freeze({
    symbol: Object.freeze({ analyzer: keywordAnalyzer, weight: 4, b: 0 }),
    parts: Object.freeze({ source: "symbol", analyzer: codeAnalyzer, weight: 2 }),
    description: Object.freeze({ analyzer: unicodeAnalyzer, weight: 1 })
  })
});

export { LexicalSearch, apiSearchPreset, bm25, codeAnalyzer, createAnalyzer, keywordAnalyzer, unicodeAnalyzer };
