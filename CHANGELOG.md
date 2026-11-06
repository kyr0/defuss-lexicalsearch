# Changelog

## 0.4.0 (2026-11-06)

- Added: the search option `language`, a BCP 47 tag such as a language identifier's guess. The fields whose analyzer has that language weigh `languageBoost` times more (default 3) and every other field still matches. With defuss-lid's `major_20` guesses, R@1 on tiny-embedding-bench-v1 rises from 80.6% over all fields to 89.0%, against 90.3% with the known language.
- Added: the analyzer property `language`; each of the 20 language entries sets its ISO 639 code. Analyzer IDs are unchanged, because tokens are.
- Added: `make bench` measures two guessed-language strategies with defuss-lid 0.5.0 (a dev dependency): the `language` option and the guessed field alone. The website shows the guessed language as a tab, and the README's comparison table is generated from the report.

## 0.3.0 (2026-10-31)

- Added: analyzers for 15 more languages, 20 in all. Snowball 3.1.1 stemmers for Russian, Polish, Indonesian, Portuguese, Italian, Dutch, Turkish, Arabic and Hindi (`defuss-lexicalsearch/ru` and so on, and `stem_ru` to `stem_tr` from `/stem`), with Snowball stopwords for Russian, Italian, Portuguese and Dutch; word segmentation for Chinese and Thai; syllable bigrams for Korean; words plus trigrams for Bangla and Urdu; tone mark folding for Vietnamese. Each generated stemmer reproduces Snowball's reference output for its whole test vocabulary.
- Added: `ru` drops stress marks, so `приве́т` finds `привет`; `tr` lowercases with Turkish rules and drops suffixes after an apostrophe; `ur` folds Arabic kaf and yeh to their Urdu forms. The new analyzers keep words with soft hyphens or zero-width (non-)joiners whole.
- Added: the analyzer option `segmented`. Under `operator: 'any'`, one word of an unspaced query fragment now suffices for `ja`, `zh`, `th`, `ko`, `bn` and `ur`; before, every segmented word of the fragment had to occur, so a Japanese question matched almost nothing. `operator: 'all'` and phrases still require all words. `ja` keeps the id `ja-intl-word-v1`, because its tokens are unchanged.
- Added: `bench/recall.mjs`, run by `make bench` and `make docs`, measures R@1, R@5 and R@10 per language on tiny-embedding-bench-v1 for four search strategies. With the question's language known, mean R@5 over 20 languages is 97.3%, against 74.9% with the default analyzer.
- Added: the website section "Measured, not promised" shows R@5 per language in one tab per strategy, rendered from `docs/data/recall.json`; the notes demo offers all 20 language analyzers.

## 0.2.0 (2026-10-31)

First release on npm. Adds `LexicalSearch` with field-weighted BM25, per-field analyzers, derived fields, raw/folded keyword and whitespace analyzers, optional accent folding, literal equality/prefix/suffix/substring, configurable exact-first tiers, token suffix/substring retrieval, optional OSA transpositions, query exclusions, escaped query syntax, and bounded remote loading. Includes the API-search preset, browser/API/Worker examples and independent oracle/regression tests.

Changes since the unpublished build of 2026-10-30:

- Added: typo-tolerant completion. With `prefix` and `fuzzy` together, the last query token also matches terms that start within the edit radius (`Kül` finds `Kühlschrank`), weighted `.44 / distance`, below a whole-word typo.
- Added: a project website in `docs/` with a live demo over 410 documentation pages: ranked, exact, prefix, suffix and substring search with completion, typos and inside-word matching on by default, field and section filters, a page palette, a hidden needle, a notes index with seven analyzers and an in-browser benchmark. `make docs` refreshes its library copy and figures; `make demo` serves it.
- Fixed: `koelnerPhonetik` follows the published Kölner Phonetik rule table, including uppercase input, umlauts, ß and the C, D/T, P and X context rules; `koelnerPhonetik('Breschnew')` returns `17863`.
- Fixed: `spanishMetaphone` applies every replacement (b as V, ll as Y, accented vowels) to all occurrences instead of the first only.
- Changed: the language analyzer IDs are `en-lexicalsearch-v1`, `de-lexicalsearch-v1`, `es-lexicalsearch-v1` and `fr-lexicalsearch-v1`; a snapshot that names an earlier ID restores only when the caller registers an analyzer under that ID.
- Removed: the legacy class and type aliases of `LexicalSearch`, `LexicalSearchOptions` and `LexicalDocument`, reading of pre-0.2 snapshots, and the migration guide.
- Fixed: a query whose whole text, or one of its tokens, is longer than `maxTokenLength` threw a `RangeError` instead of searching; the limit now applies to indexed tokens only.
- Added: needle-in-a-haystack tests over 410 MDX pages of defuss-shadcn documentation, checked against scan oracles.
- Fixed: the build cleans `dist/` first, so the tarball no longer ships orphaned chunks of earlier builds.
- Changed: development runs on bun and oxlint; `make verify` runs lint, tests, coverage and an e2e that installs the packed tarball in a clean consumer and drives the examples in Chromium. The tests and the e2e consumer run on Node.js 26 and on bun 1.4.
- Removed: checksum, provenance and delivery files (`SHA256SUMS`, `NOTICE.md`, `docs/UPSTREAM.json`, `docs/VALIDATION.md`, `docs/check.log`) and committed benchmark results; `make bench` writes fresh results to `output/bench/`.
