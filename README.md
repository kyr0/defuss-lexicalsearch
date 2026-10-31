# defuss-lexicalsearch

[![npm](https://img.shields.io/npm/v/defuss-lexicalsearch)](https://www.npmjs.com/package/defuss-lexicalsearch)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Full-text search for TypeScript and JavaScript apps, in the browser or Node.js: ranked, typo-tolerant search over your documents and exact matching for symbols such as `C++` or `Array.prototype.map`, in one in-memory index with zero runtime dependencies.

## TL;DR

Search inside an app, over documentation, API references or notes, needs ranked search that forgives typos and fragments, and exact matches for symbols that a word tokenizer breaks apart: `C++` and `C#` both become the word `c`. defuss-lexicalsearch answers both from one index inside the page or process: indexing and search need no server and no network access. With exact-first ranking, an exact symbol match always ranks above a partial one.

- Field-weighted BM25 with an analyzer per field, and derived fields that analyze one string twice, for example as a raw symbol and as code words.
- Exact-first ranking in tiers: `literal`, `keyword`, `identifier-prefix`, `term`, `partial`, `fuzzy` and `incomplete`; BM25 orders the results within a tier.
- Literal modes that compare original strings: `exact`, `prefix`, `suffix` and `substring`, case-sensitive by default.
- Search as you type: completion, inside-word matching, Levenshtein or transposition-aware typos, and completion despite a typo (`Kül` finds `Kühlschrank`).
- Quoted phrases, AND and OR, exclusions, field restrictions, metadata and ID filters, and pagination.
- Analyzers for Unicode words, code identifiers, keywords and whitespace-separated symbols; stemming, stopwords and phonetic codes for English, German, Spanish and French; word segmentation for Japanese.
- Atomic batch inserts and replacements, complete deletion, JSON snapshots and size-bounded loading from a URL.
- ESM and CommonJS builds with TypeScript declarations, and a module Worker example for browsers.

## Quick start

Install the package from [npm](https://www.npmjs.com/package/defuss-lexicalsearch). Its `engines` field requires Node.js 26 or newer, and the tests also run it on bun 1.4.3:

```sh
npm install defuss-lexicalsearch
```

With bun, run `bun add defuss-lexicalsearch` instead.

A first search, with a typo in the query:

```ts
import { LexicalSearch } from 'defuss-lexicalsearch';

const index = new LexicalSearch({ fields: { title: { weight: 3 }, body: {} } });
index.addAll([
  { id: 'dialog', fields: { title: 'Dialog', body: 'A modal window for focused tasks.' } },
  { id: 'sheet', fields: { title: 'Sheet', body: 'A panel that slides in from the edge of the screen.' } },
]);

const hits = index.search('dialgo', { fuzzy: true, transpositions: true });
console.log(hits.map(hit => hit.id)); // [ 'dialog' ]
```

Each example on this page except the `fromURL` call, which needs a server, prints what its comments state; `test/readme.test.mjs` runs them against the built package, on Node.js and on bun.

## Usage

### Rank natural-language text

A language analyzer stems words, so `run` finds `Running` and `local` finds `locally`. `operator: 'all'` requires every query word, and `filter` checks each candidate's metadata:

```ts
import { LexicalSearch } from 'defuss-lexicalsearch';
import en from 'defuss-lexicalsearch/en';

const index = new LexicalSearch<{ category: string }>({
  analyzer: en,
  fields: { title: { weight: 3 }, body: {} },
});
index.addAll([
  { id: 'a', fields: { title: 'Running locally', body: 'A local search engine.' }, metadata: { category: 'guide' } },
  { id: 'b', fields: { title: 'Remote storage', body: 'Keep documents in a remote store.' }, metadata: { category: 'reference' } },
  { id: 'c', fields: { title: 'Local storage', body: 'Store documents locally.' }, metadata: { category: 'reference' } },
]);

console.log(index.search('run local').map(hit => hit.id)); // [ 'a', 'c' ]
console.log(index.search('run local', { operator: 'all' }).map(hit => hit.id)); // [ 'a' ]
console.log(index.search('local', { filter: metadata => metadata?.category === 'reference' }).map(hit => hit.id)); // [ 'c' ]
console.log(index.search('"remote store"').map(hit => hit.id)); // [ 'b' ]
```

Without an `analyzer` option, an index uses `unicodeAnalyzer`: NFKC normalization, lowercase, Unicode letters, digits and combining marks as words, and punctuation as a separator, with no stemming and no stopwords. It cannot tell `C++` from `C#`, because both analyze to `c`; the next section handles symbols.

### Search API symbols and identifiers

`apiSearchPreset` keeps each symbol as a raw keyword and also splits it into code words, so an exact symbol and its parts are both searchable:

```ts
import { LexicalSearch, apiSearchPreset } from 'defuss-lexicalsearch';

const index = new LexicalSearch(apiSearchPreset);
index.addAll([
  { id: 'cpp', fields: { symbol: 'C++', description: 'C++ language reference.' } },
  { id: 'csharp', fields: { symbol: 'C#', description: 'C# language reference.' } },
  { id: 'map', fields: { symbol: 'Array.prototype.map', description: 'Transform array elements.' } },
]);

// Literal mode compares the original symbol string: only C++, never C#.
console.log(index.search('C++', { mode: 'exact', fields: ['symbol'] }).map(hit => hit.id)); // [ 'cpp' ]
// Ranked search returns C# too, through the shared code word "c", but in a lower tier.
console.log(index.search('C++').map(hit => `${hit.id}:${hit.tier}`)); // [ 'cpp:literal', 'csharp:term' ]
console.log(index.search('Array.prototype.ma', { prefix: true }).map(hit => hit.id)); // [ 'map' ]
console.log(index.search('prottoype', { fuzzy: 1, transpositions: true }).map(hit => hit.id)); // [ 'map' ]
```

The preset defines three fields. `symbol` holds the whole field as one raw keyword (weight 4; BM25 length normalization `b` 0, so a long symbol scores like a short one), `parts` derives code words from `symbol` (weight 2), and `description` holds Unicode text (weight 1). It selects exact-first ranking and allows indexed tokens of up to 1024 code points. Documents supply `symbol`, `description` or both, never the derived `parts`.

To define the fields yourself, give each field its own analyzer; a field with `source` analyzes another field's string again:

```ts
import { LexicalSearch, keywordAnalyzer, codeAnalyzer } from 'defuss-lexicalsearch';
import de from 'defuss-lexicalsearch/de';

const index = new LexicalSearch({
  ranking: 'exact-first',
  fields: {
    name: { analyzer: keywordAnalyzer, weight: 4 },
    components: { source: 'name', analyzer: codeAnalyzer, weight: 2 },
    description: { analyzer: de },
  },
});
index.add({ id: 'map', fields: { name: 'Array.prototype.map', description: 'Verarbeitet Elemente.' } });

console.log(index.search('Array.prototype.map').map(hit => hit.tier)); // [ 'literal' ]
console.log(index.search('prototype').map(hit => hit.tier)); // [ 'term' ]
console.log(index.search('element').map(hit => hit.id)); // [ 'map' ]
```

A `source` must name a configured field that is not derived itself, so derivations cannot chain. A field a document omits stays missing; an empty string yields no tokens, and the index keeps its original value.

### Search as you type

For a search box, combine completion of the last word, inside-word matching and typo tolerance. With `prefix` and `fuzzy` together, the last word also completes when the part typed so far contains a typo:

```ts
import { LexicalSearch } from 'defuss-lexicalsearch';

const index = new LexicalSearch();
index.addAll([
  { id: 'fridge', fields: { text: 'Der Kühlschrank ist leer.' } },
  { id: 'xhr', fields: { text: 'Retry with XMLHttpRequest.' } },
]);
const asYouType = { prefix: true, substring: true, fuzzy: true, transpositions: true } as const;

console.log(index.search('Kül', asYouType).map(hit => hit.id)); // [ 'fridge' ]
console.log(index.search('schrank', asYouType).map(hit => hit.id)); // [ 'fridge' ]
console.log(index.search('http', asYouType).map(hit => hit.id)); // [ 'xhr' ]
console.log(index.search('retyr', asYouType).map(hit => hit.id)); // [ 'xhr' ]
```

Every expansion weighs less than an exact match (see [Ranking and results](#ranking-and-results)); with `ranking: 'exact-first'`, an exact word always ranks above an expansion. The search methods are synchronous; in a browser, run large indexes in a Worker (see [Run search in a Worker](#run-search-in-a-worker)).

### Keep the index current and save it

`add` rejects a duplicate ID and `upsert` replaces the document. `serialize` writes a JSON snapshot, and `fromJSON` rebuilds the index from it:

```ts
import { LexicalSearch, apiSearchPreset } from 'defuss-lexicalsearch';

const index = new LexicalSearch(apiSearchPreset);
index.addAll([
  { id: 'cpp', fields: { symbol: 'C++', description: 'C++ language reference.' } },
  { id: 'csharp', fields: { symbol: 'C#', description: 'C# language reference.' } },
]);
index.upsert({ id: 'cpp', fields: { symbol: 'C++', description: 'Updated reference.' } });
index.remove('csharp');

console.log(index.has('csharp'), index.get('cpp')?.fields.description); // false Updated reference.
const restored = LexicalSearch.fromJSON(index.serialize());
console.log(restored.search('C++').map(hit => hit.id)); // [ 'cpp' ]
```

`addAll` validates the whole batch before it inserts anything, and `upsert` prepares the new version before it removes the old one, so a validation or analyzer error leaves the index unchanged. This covers thrown errors, not a crashed process or an out-of-memory condition. Deletion updates postings, vocabularies, the lazily built suffix and substring indexes, raw-value lookups and BM25 statistics; `clear()` empties the index.

Metadata must be plain JSON that serializes without loss, with finite numbers only: no cycles, holes, getters, non-plain objects, symbols or `undefined`. The index copies inputs, freezes its own metadata and returns copies. A `filter` callback runs at most once per candidate and receives frozen metadata; a search or mutation started from inside a callback throws.

A snapshot (format version 2) holds the original documents, the field schema, the ranking policy and analyzer IDs, and `fromJSON` rebuilds every structure from them. Built-in analyzers resolve by ID; pass language and custom analyzers, as a registry or as the single analyzer:

```ts
import { LexicalSearch } from 'defuss-lexicalsearch';
import en from 'defuss-lexicalsearch/en';

const index = new LexicalSearch({ analyzer: en });
index.add({ id: 'a', fields: { text: 'Running locally' } });
const json = index.serialize();

console.log(LexicalSearch.fromJSON(json, { [en.id]: en }).search('run').map(hit => hit.id)); // [ 'a' ]
console.log(LexicalSearch.fromJSON(json, en).search('run').map(hit => hit.id)); // [ 'a' ]
```

`fromURL` loads a snapshot over HTTP(S) and is the only method that uses the network:

```ts no-run
import { LexicalSearch } from 'defuss-lexicalsearch';
import en from 'defuss-lexicalsearch/en';

const remote = await LexicalSearch.fromURL('https://example.org/search.json', {
  maxBytes: 64 * 1024 * 1024,
  request: { signal: AbortSignal.timeout(10_000) },
  analyzers: { [en.id]: en },
});
```

It rejects a non-success HTTP status, a response larger than `maxBytes` (default 64 MiB, checked against the declared length and while streaming) and invalid UTF-8, then validates the snapshot like `fromJSON`. Authentication, CORS and timeouts come from the runtime's `fetch` and the `request` options; the `fetch` option replaces the runtime's function. Parsing and rebuilding run synchronously after the download.

### Run search in a Worker

The library API is synchronous, so a large index on a browser's main thread blocks input while it indexes or searches. [`examples/worker.mjs`](examples/worker.mjs) is a module Worker that holds one index. It answers `{ requestId, action, payload }` messages for the actions `initialize`, `search`, `upsert`, `remove`, `get`, `clear`, `stats`, `serialize` and `restore` with `{ requestId, result }` or `{ requestId, error }`. Functions cannot cross the Worker boundary, so messages name analyzers by ID or select `preset: 'api'`; a custom analyzer must be added to the module's registry. The example imports the build from `../dist/`; adjust that path when you copy it.

## Reference

### Query syntax and match options

| Request | Meaning |
| --- | --- |
| `search('fox')` | Exact analyzed token; prefix and fuzzy matching off |
| `search('red fox')` | OR of the free query atoms |
| `search('red fox', { operator: 'all' })` | Every active free atom must match; atoms may match in different fields |
| `search('"red fox"')` | Adjacent analyzed tokens in one field; quoted phrases are mandatory |
| `{ prefix: true }` | Completes the last unquoted token of the last free atom |
| `{ suffix: true }`, `{ substring: true }` | Expands each free token by suffix or substring |
| `{ fuzzy: 1, transpositions: true }` | At most one edit, an adjacent swap counting as one |
| `{ prefix: true, fuzzy: true }` | Also completes the last token despite typos: `Kül` finds `Kühlschrank` |
| `{ exclude: ['deprecated'] }` | Removes the matches of these queries before pagination |
| `{ mode: 'exact' }` | Equality with the whole original field; no tokenizer, no query syntax |
| `{ mode: 'prefix' }`, `'suffix'`, `'substring'` | Literal string relation with the original field contents |

A free atom is a whitespace-delimited fragment of the query. Every analyzed component of one atom must occur in the same field, though not adjacently: under a word analyzer, `foo.bar` requires both `foo` and `bar`, while `foo bar` with the default OR accepts either. A query of several words against a keyword field also tries the complete unquoted input as one keyword. When the exact query string is the key, use `mode: 'exact'`.

Quoted phrases never cross fields, and fuzzy or partial expansion never makes a document eligible for a phrase. Stemming and normalization apply to phrases as to other text, so `"foo.bar"` under a word analyzer is no literal punctuation match; `mode: 'substring'` matches a literal span. A query whose clauses all analyze to nothing returns no hits. A stopword atom is inactive only when every selected field's analyzer discards it; restrict `fields` when analyzers differ in their stopwords.

Only double quotes are query syntax. A backslash escapes `"` or `\`, and any other backslash stays literal, so paths keep their backslashes. An unclosed quote throws. `AND`, `OR`, `NOT`, colons, parentheses, asterisks and regex characters carry no meaning; options select Boolean behavior and fields. Literal modes bypass the parser.

Literal comparisons are case-sensitive and do not trim, normalize, stem or remove punctuation. `caseSensitive: false` lowercases both strings with JavaScript's Unicode lowercase, without locale-specific collation or compatibility normalization; it also governs the `literal` tier of ranked search, but never a field analyzer's own case policy. An empty query returns no hits in every mode, and lexical expansion options cannot be combined with a literal mode.

`exclude` takes at most 32 query strings, matched with the same mode, fields, operator and expansion options. Their matches are removed before the metadata filter and the top-k selection, and each exclusion costs its own retrieval. An exclusion alone matches nothing; it never turns a query into match-all.

### Ranking and results

By default, `ranking: 'relevance'` sums field-weighted BM25 contributions with `idf = log(1 + (N - df + .5) / (df + .5))`. `N`, `df` and the average length are computed per field and count only documents whose field has analyzed tokens. Each field is scored separately, so this is weighted BM25, not BM25F.

`ranking: 'exact-first'` sorts by these tiers, strongest first:

1. `literal`: the whole original field equals the query, after quote and escape decoding, whitespace included.
2. `keyword`: an exact analyzed keyword, such as a case-folded identifier.
3. `identifier-prefix`: a keyword starts or ends with the query.
4. `term`: the analyzed words of the query occur exactly.
5. `partial`: a word starts with, ends with or contains the query.
6. `fuzzy`: a word lies within the edit distance.
7. `incomplete`: under OR, at least one active query atom is missing.

Each clause takes its best complete match in one field, and a result's tier is the weakest of its clauses; a whole-field equality raises an otherwise eligible result to `literal`. Within a tier, results sort by descending score, then by ascending ID, so ties come out in the same order every time. Corpus statistics and field weights never move a result across tiers. In literal modes, equality yields `literal`, prefix and suffix yield `identifier-prefix`, and substring yields `partial`; the score is the sum of the matching fields' weights, not BM25.

A result is `{ id, rank, score, metadata? }`, with `tier` under exact-first ranking. `explain: true` adds the contributions per term and field, which sum to the score. Under exact-first ranking, scores need not decrease from one tier to the next, so **use the returned order or `rank`, never a re-sort by score**. Scores are not probabilities and are not calibrated for mixing with vector similarity; to merge with a vector index such as [defuss-vectorsearch](https://github.com/kyr0/defuss-vectorsearch), share document IDs and fuse the ranks.

Alternatives of one analyzed query token in one field contribute once, with their highest score, and exact-first ranking prefers the stronger match kind there. A repeated token does not add score. Expansions are weighted against an exact match (1): prefix 0.8, suffix 0.75, substring 0.65, fuzzy 0.55 divided by the distance, and fuzzy completion 0.44 divided by the distance; agreeing phonetic codes multiply a fuzzy weight by 1.1. These weights are hand-set heuristics, not values fitted to a benchmark.

`searchWithStats()` returns `{ hits, total, stats }`. `total` counts every eligible result before pagination, and `limit: 0` returns only the count and stats. Ranks start at 1 and include the offset. `stats` counts expanded alternatives, posting and string probes, and the candidates scored; exclusions add their lookups to the first two. These counters measure retrieval work, not CPU operations, and a repeated probe counts each time it runs.

### Analyzers and typo settings

| Analyzer | Behavior |
| --- | --- |
| `unicodeAnalyzer` | NFKC and lowercase Unicode words; punctuation separates |
| `codeAnalyzer` | Unicode words, split at camelCase, acronyms, underscores and path separators |
| `keywordAnalyzer` | The whole nonempty field as one token, unchanged |
| `foldedKeywordAnalyzer` | The whole field, lowercased; punctuation kept |
| `whitespaceAnalyzer` | Whitespace-delimited symbols; case and punctuation kept |
| `accentFoldedAnalyzer` | NFKD, combining marks removed, lowercase; accents no longer distinguish words |
| `defuss-lexicalsearch/en`, `/de`, `/es`, `/fr` | Snowball stemmer, stopwords and phonetic encoder |
| `defuss-lexicalsearch/ja` | Word segmentation by `Intl.Segmenter`, so results depend on the runtime's ICU data |

`createAnalyzer({ id, tokenize, normalize?, stem?, stopWords?, phonetic?, kind? })` builds a custom analyzer; without `normalize`, it applies NFKC and lowercase. A `kind: 'keyword'` tokenizer must return the whole nonempty input as one token, and intentional changes belong in `normalize`. Give the analyzer a new versioned ID whenever its behavior changes: an index rejects two different definitions under one ID, and a snapshot cannot check that a supplied function still matches the behavior its ID had when the snapshot was written.

Stopwords keep their positions for phrases but are left out of the free-query requirements. Language analyzers are explicit imports; the library never guesses a language. The stemmers and phonetic encoders are exported separately from `defuss-lexicalsearch/stem` and `defuss-lexicalsearch/phonetic`.

`fuzzy: true` allows no edit for 1 or 2 code points, one edit for 3 to 5 and two edits from 6; `fuzzy: 0`, `1` or `2` sets the radius explicitly. Edits follow Levenshtein distance by default, and `transpositions: true` switches to optimal string alignment, which counts an adjacent swap as one edit (restricted Damerau, **not unrestricted Damerau-Levenshtein**). With `prefix: true` as well, a term also matches when one of its prefixes lies within the radius, at that prefix's distance. With `phonetic: true` and an analyzer that has a phonetic encoder (the language analyzers), matching phonetic codes boost a fuzzy candidate; they never retrieve a word that is not within the edit distance.

### Limits and performance

| Limit | Default | Configurable |
| --- | --- | --- |
| Documents per index | 100,000 | `maxDocuments` |
| Code points per indexed token | 128 (API preset: 1024) | `maxTokenLength`, at most 4096 |
| UTF-16 code units per query | 16,384 | no |
| Raw clauses per query | 128 | no |
| Analyzed tokens per query and field | 128 | no |
| Exclusion queries | 32 | no |

A query token longer than `maxTokenLength` matches no indexed token exactly, but fuzzy expansion can still reach shorter terms.

Exact, prefix and fuzzy token matching use each field's postings and vocabulary trie. Suffix matching builds a reverse trie on first use. A substring of three or more code points builds a trigram index of the vocabulary on first use, intersects the candidate sets and verifies each term with `includes`; a shorter substring scans the vocabulary. Mutations keep these lazily built indexes current, and no expansion is capped, so no match is dropped silently.

Case-sensitive literal equality uses a map of raw field values. Literal prefix, suffix and substring modes and case-insensitive equality scan the original values of the selected fields; an `ids` restriction shrinks that scan. For fast repeated identifier completion, put identifiers in keyword fields and use the lexical `prefix`, `suffix` or `substring` options. Short or broad queries can still visit the whole vocabulary or corpus, and a larger `offset` needs a larger top-k heap. `make bench N=10000` measures indexing and search on synthetic documents and writes the results to `output/bench/`.

### Not included

The library has no regex or wildcard query language, phrase slop, positional synonyms, language detection, standalone TF-IDF or n-gram vector API, content-hash IDs, highlight offsets or snippets, and no distributed or persistent index; snapshots keep the original strings rather than a compressed binary index.

## Configuration

The library takes its configuration as constructor and search options, described above. The optional `.env` keys configure development commands only; copy `.env.example` to `.env` to set them:

| Key | Meaning | Default |
| --- | --- | --- |
| `CHROMIUM_PATH` | Chromium executable for `make e2e` | empty: Playwright's bundled Chromium |
| `PORT` | Port of `make demo` | 8080 |

## How it works

For every field, indexing runs the field's analyzer and adds the tokens to postings with positions, a vocabulary trie and BM25 statistics. A query either compares original field strings (literal modes) or is parsed into words and quoted phrases, analyzed like the field, expanded where the options ask for it, matched cheapest clause first and ranked. [ARCH.md](ARCH.md) explains the design decisions, the matching and scoring pipeline, operations, security and privacy.

## Website

The website at [lexicalsearch.defuss.org](https://lexicalsearch.defuss.org), built from `docs/`, is the project page and a live demo. It downloads 410 pages of defuss-shadcn documentation, indexes them in a Web Worker and searches them as you type, with every match mode, a page palette, a hidden needle to find, a notes index of your own with seven analyzers, and a benchmark measured in your browser. `make demo` serves it on `127.0.0.1:8080`, with the examples under `/examples/`: `/examples/browser.html` searches natural text and `/examples/api.html` searches API symbols.

GitHub Pages serves `docs/` without a build step. The page loads defuss-shadcn from jsDelivr with subresource integrity and the library from `docs/assets/lib`. After a library change, `make docs` copies the ESM build there and rewrites `docs/data/manifest.json`; the e2e compares every figure on the page with that manifest.

## Development

```sh
make setup && make verify
```

`make setup` installs the tools pinned in `mise.toml` (Node.js and bun, through [mise](https://mise.jdx.dev)), the locked dependencies and Playwright's Chromium. `bun pm pack` builds the package tarball. `make verify` runs, in order:

| Verb | What it checks |
| --- | --- |
| `make lint` | oxlint with warnings as errors, and strict TypeScript |
| `make test` | a clean build, then the tests on Node.js and again on bun (exhaustive oracles, a needle-in-a-haystack suite over 410 MDX pages, the README examples) and ESM and CommonJS declaration checks |
| `make coverage` | line coverage of the built ESM modules, printed as `TOTAL <n>%` |
| `make e2e` | packs the tarball and checks that it holds only `package.json`, `README.md`, `LICENSE` and build files that an export reaches, installs it in a clean consumer under `tmp/`, runs it on Node.js and bun, drives the examples and the Worker in Chromium, then drives every section of the website with the packed build and runs the website's usage snippet on both runtimes; writes `output/e2e/report.json` and screenshots |

`make` lists every verb. The haystack `docs/data/defuss-shadcn-docs.json.gz`, also the website's demo corpus, is a snapshot of defuss-shadcn's documentation at one commit and carries that project's MIT license; `node scripts/haystack-fixture.mjs <commit>` rebuilds it. Start reading the code from [ARCH.md](ARCH.md).

## License

MIT, see [LICENSE](LICENSE).
