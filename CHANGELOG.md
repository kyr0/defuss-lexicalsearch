# Changelog

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
