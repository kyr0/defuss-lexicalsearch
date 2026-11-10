# Episodes

<!-- Newest last. The gate appends FAIL|DONE|FINDING; past 100 entries it trims only its own oldest DONE|FAIL|learned
FINDING (git keeps them). Leads (LESSON, FINDING learn=none) stay until wrap settles them; doctor fails above 30.
Agents append `<UTC ISO> s=<session> LESSON <VAE-DIALECT>` only for a falsified HYPOTHESIS, a dead end, or a root cause.
Session start injects the 3 newest open entries: LESSON, FINDING learn=none, FAIL without a later DONE.
Wrap: EVERY lead becomes a test | .vae/VERIFY.py rule | one MEMORY line with BC, then delete; OR delete BC evidence. -->

2026-10-30T22:31:31Z s=ab460516 FAIL env.example
2026-10-30T22:40:15Z s=ab460516 DONE fp=8fcdaf6b08f6 cov=74.8% paths=AGENTS.md,ARCH.md,CHANGELOG.md,Makefile(+54)
2026-10-30T22:40:15Z s=ab460516 FINDING package.json:scripts.build learn=test: scripts/e2e.mjs asserts every packed dist file is reachable from package exports; probe with an injected dist/analyzer-STALE.js failed with 'packed files unreac
2026-10-30T22:40:15Z s=ab460516 FINDING src/phonetic/de.ts:koelnerPhonetik learn=test: test/phonetic.test.mjs pins reference codes (Müller-Lüdenscheidt 65752682, Breschnew 17863, Wikipedia 3412, Meier=Mayr) that the old code fails
2026-10-30T22:40:15Z s=ab460516 FINDING src/phonetic/es.ts:replaceSpanishCharacters learn=test: test/phonetic.test.mjs asserts b/v, ll/y and ch/x equivalence on words with repeated occurrences
2026-10-30T22:40:15Z s=ab460516 FINDING scripts/server.mjs:serve learn=test: scripts/browser.mjs asserts 404 for /package.json, /.git/config and /examples/../package.json in every e2e run
2026-10-30T22:40:15Z s=ab460516 FINDING SHA256SUMS, NOTICE.md, docs/UPSTREAM.json, docs/VALIDATION.md, docs/check.log, defuss-lexicalsearch-0.2.0.tgz, bench/*-results-*.json, README.md delivery sections learn=verifier: .vae/VERIFY.py rule hygiene.no-delivery-leftovers fails when any of these files or a root *.tgz reappears (probed with a NOTICE.md)
2026-10-30T22:40:15Z s=ab460516 FINDING scripts/pack-smoke.mjs, scripts/browser-test.mjs learn=test: make e2e is a gate verb; browser.mjs fails on pageerror, console error, requestfailed and HTTP >= 400
2026-10-30T22:40:15Z s=ab460516 FINDING test/search.test.mjs:305 learn=verifier: make lint (oxlint --deny-warnings) is a gate verb
2026-10-30T22:40:15Z s=ab460516 FINDING scripts/browser.mjs:CHROMIUM_PATH, scripts/server.mjs:PORT learn=verifier: builtin env.example gate check
2026-10-30T22:40:15Z s=ab460516 FINDING README.md:210, CHANGELOG.md:3, docs/ARCHITECTURE.md:1 learn=verifier: builtin prose and docs.pages gate checks
2026-10-30T22:45:46Z s=ab460516 DONE fp=cafedbc4c5d0 cov=74.8% paths=AGENTS.md,ARCH.md,CHANGELOG.md,Makefile(+53)
2026-10-30T22:45:46Z s=ab460516 FINDING src/{de,en,es,fr}.ts:id, src/engine.ts:fromJSON, src/index.ts, src/types.ts learn=verifier: .vae/VERIFY.py rule naming.no-former-names fails on any former name (probed with a planted file)
2026-10-30T23:01:35Z s=ab460516 DONE fp=87cecd8a3f6b cov=74.8% paths=AGENTS.md,ARCH.md,CHANGELOG.md,Makefile(+55)
2026-10-30T23:01:35Z s=ab460516 FINDING src/analyzer.ts:analyze, src/engine.ts:retrieve addClause learn=test: test/lexical.test.mjs 'query tokens longer than the indexed token limit…' failed before the fix; test/haystack.test.mjs checks every page path and title
2026-10-30T23:01:35Z s=ab460516 FINDING .vae/VERIFY.py:naming.no-former-names learn=verifier: rule still fails on a planted former class name
2026-10-30T23:29:15Z s=ab460516 FAIL prose
2026-10-30T23:33:38Z s=ab460516 DONE fp=533fac0955ae cov=74.8% paths=.oxlintrc.json,AGENTS.md,ARCH.md,CHANGELOG.md(+82)
2026-10-30T23:33:38Z s=ab460516 FINDING docs/assets/search-worker.js:bench learn=test: scripts/site.mjs asserts every measured figure matches /^\d+(\.\d+)? (µs|ms)$/; a zero median would still match, so the batch sizing is the fix, not a test of a
2026-10-30T23:33:38Z s=ab460516 FINDING docs/assets/demo.js:examples|palette|needle learn=test: scripts/site.mjs leaves the section filter on 'overlays' and asserts the 'scaff' example resets it to 'all' and ranks application-scaffolds.mdx first.
2026-10-30T23:33:38Z s=ab460516 FINDING docs/assets/demo.css:.ls-control .toggle-group learn=test: scripts/site.mjs asserts no horizontal page scroll at 390 px; the clipped group sat inside overflow-x:clip, so the visual check came from the screenshot.
2026-10-30T23:33:38Z s=ab460516 FINDING docs/index.html:tier-list learn=none: visual-only; no mechanical check distinguishes badge fills.
2026-10-30T23:33:38Z s=ab460516 FINDING docs/assets/render.js:renderBenchRows learn=none: presentation; covered by the bench row count check in scripts/site.mjs.
2026-10-30T23:33:38Z s=ab460516 FINDING docs/assets/search-view.js:summary learn=none: presentation only.
2026-10-30T23:33:38Z s=ab460516 FINDING README.md:Website learn=none: copy fix against docs/index.html#notes-analyzer.
2026-10-30T23:33:38Z s=ab460516 FINDING docs/index.html:intro-2|intro-5 learn=none: copy fix against README.md and ARCH.md.
2026-10-30T23:33:38Z s=ab460516 FINDING docs/index.html:prose learn=verifier: CONFIG prose.html=['docs/*.html'] now checks the site on every gate run.
2026-10-30T23:48:48Z s=ab460516 DONE fp=b3b5276f96c0 cov=74.8% paths=.oxlintrc.json,AGENTS.md,ARCH.md,CHANGELOG.md(+82)
2026-10-30T23:48:48Z s=ab460516 FINDING src/trie.ts:Vocabulary.fuzzy|src/engine.ts:expand learn=test: test/lexical-oracles.test.mjs checks completion against an exhaustive closest-prefix oracle (Levenshtein and OSA, distances included); test/lexical.test.mjs pin
2026-10-30T23:48:48Z s=ab460516 FINDING docs/assets/search-worker.js:searchNotes|docs/index.html#opt-substring learn=test: scripts/site.mjs searches a note for Kül, ühl, schrank and http in Chromium and expects that note first.
2026-10-30T23:48:48Z s=ab460516 FINDING docs/index.html#hero-size|#intro-size learn=test: scripts/site.mjs compares the static figures with docs/data/manifest.json.
2026-10-31T00:08:01Z s=ab460516 DONE fp=fca4358f1a7d cov=75.0% paths=.oxlintrc.json,AGENTS.md,ARCH.md,CHANGELOG.md(+83)
2026-10-31T00:08:01Z s=ab460516 FINDING README.md:usage examples learn=test: test/readme.test.mjs runs every ```ts block against the built package and compares console output with the comments; a mutated expectation fails it (checked).
2026-10-31T00:15:06Z s=ab460516 DONE fp=2b4d2b01dd3f cov=75.0% paths=.oxlintrc.json,AGENTS.md,ARCH.md,CHANGELOG.md(+83)
2026-10-31T00:15:06Z s=ab460516 FINDING docs/index.html#intro-2|tier-list, docs/assets/render.js:TIER_VARIANTS learn=test: scripts/site.mjs asserts the 'literal' tier badge and 'fuzzy 1' on a typo match.
2026-10-31T00:15:06Z s=ab460516 FINDING scripts/e2e.mjs:shipped learn=test: make e2e fails when the tarball holds anything but package.json, README.md, LICENSE and dist/*.js|cjs|d.ts|d.cts; probe showed .map, src/, docs/ and CHANGELOG r
2026-10-31T00:27:30Z s=ab460516 DONE fp=be6572f270b2 cov=75.0% paths=.oxlintrc.json,AGENTS.md,ARCH.md,CHANGELOG.md(+83)
2026-10-31T00:27:30Z s=ab460516 FINDING Makefile:2 learn=none: a comment; package.json engines is the single source the README cites.
2026-10-31T00:27:30Z s=ab460516 FINDING package.json:scripts.test, scripts/e2e.mjs, test/readme.test.mjs learn=test: make test runs the suite under bun test after node --test (114/114 each); make e2e runs smoke.mjs and usage.mjs with bun and records its version in output/e2e/r
2026-10-31T00:52:54Z s=ab460516 DONE fp=db1c7f718551 cov=75.0% paths=.oxlintrc.json,AGENTS.md,ARCH.md,CHANGELOG.md(+83)
2026-10-31T00:52:54Z s=ab460516 FINDING README.md#quick-start, docs/index.html#use, CHANGELOG.md learn=none: release facts from the registry, no recurring invariant; the README example test still runs every example.
2026-10-31T15:01:53Z s=4e5a9027 DONE fp=27ff8e030a29 cov=75.5% paths=ARCH.md,CHANGELOG.md,Makefile,README.md(+80)
2026-10-31T15:01:53Z s=4e5a9027 FINDING src/ru.ts:normalize learn=test: test/languages.test.mjs 'Russian ignores stress marks' asserts the precomposed case.
2026-10-31T15:01:53Z s=4e5a9027 FINDING src/vi.ts:foldVietnameseTone learn=test: test/languages.test.mjs Vietnamese test asserts résumé stays distinct from resumé.
2026-10-31T15:01:53Z s=4e5a9027 FINDING src/ru.ts:12, src/vi.ts:3 learn=none: one-off authoring slip; grep for U+0300-U+036F in src/*.ts finds only the ru doc comment example.
2026-10-31T15:01:53Z s=4e5a9027 FINDING ARCH.md:9 learn=none: prose precision fix; numbers come from bench runs in this session.
2026-10-31T15:01:53Z s=4e5a9027 FINDING scripts/snowball.mjs:12 learn=none: doc fix; grep finds no other reference.
2026-10-31T15:03:29Z s=4e5a9027 DONE fp=8a29c1f1d83b cov=75.5% paths=ARCH.md,CHANGELOG.md,Makefile,README.md(+79)
2026-10-31T15:17:25Z s=4e5a9027 DONE fp=3e064076c0db cov=75.5% paths=ARCH.md,CHANGELOG.md,Makefile,README.md(+80)
2026-10-31T15:17:25Z s=4e5a9027 FINDING docs/index.html:526 (recall tile) learn=test: scripts/site.mjs already fails when the section differs from renderRecall(recall.json).
2026-10-31T15:17:25Z s=4e5a9027 FINDING docs/index.html:124 hero pill, :923 install learn=none: visual detail checked by screenshot; site.mjs asserts the version text and link of each tag.
2026-10-31T15:17:25Z s=4e5a9027 FINDING scripts/docs.mjs:renderLanguageGlance learn=none: simplification.
2026-10-31T15:17:25Z s=4e5a9027 FINDING docs/index.html agent prompt learn=none: copy fix.
2026-11-02T13:44:42Z s=b56c5c03 DONE fp=7990acfc00bb cov=75.6% paths=ARCH.md,CHANGELOG.md,README.md,docs/assets/lib/analyzer-CQNufUmw.js(+49)
2026-11-02T13:44:42Z s=b56c5c03 FINDING scripts/e2e.mjs:smoke.mjs consumer learn=none: Coverage of a new option in e2e is a review judgment per change; no mechanical rule can tell which option is new.
2026-11-06T11:42:51Z s=a22aa615 DONE fp=6f3976a2caaf cov=75.6% paths=ARCH.md,CHANGELOG.md,README.md,bench/recall.mjs(+57)
2026-11-06T11:42:51Z s=a22aa615 FINDING README.md:145 (B01, B09); ARCH.md:17 learn=test: test/readme.test.mjs fails when the README guess table differs from docs/data/recall.json; scripts/site.mjs checks the website tabs against RECALL_TABS.
2026-11-06T11:42:51Z s=a22aa615 FINDING src/engine.ts:245 weightOf learn=none: Review confirmation, no defect.
2026-11-06T13:04:35Z s=a22aa615 DONE fp=f7de01ca4d87 cov=75.6% paths=ARCH.md,CHANGELOG.md,README.md,bench/recall.mjs(+57)
2026-11-06T13:04:35Z s=a22aa615 FINDING package.json:3; CHANGELOG.md:3; docs/index.html version badges learn=none: Existing site.mjs and recall version checks cover it.
2026-11-10T01:24:34Z s=b56c5c03 DONE fp=94e46ec841f8 cov=75.6% paths=ARCH.md,CHANGELOG.md,README.md,bench/recall.mjs(+56)
2026-11-10T01:40:19Z s=b56c5c03 DONE fp=1647e956ed86 cov=75.6% paths=ARCH.md,CHANGELOG.md,README.md,bench/recall.mjs(+58)
2026-11-10T01:40:19Z s=b56c5c03 FINDING docs/assets/demo.css:latency table at 390 px learn=none: A layout fit at one viewport is a visual judgment; site.mjs checks the phone viewport for errors, not for clipped columns.
2026-11-10T01:40:19Z s=b56c5c03 FINDING docs/assets/demo.css:pink tokens learn=none: The CSS comment at the override records why it is unlayered; no rule kind can check cascade layers.
2026-11-10T01:46:29Z s=b56c5c03 DONE fp=ad91a5541bd7 cov=75.6% paths=ARCH.md,CHANGELOG.md,README.md,bench/recall.mjs(+59)
2026-11-10T01:46:29Z s=b56c5c03 FINDING docs/assets/render.js:renderSearchStats learn=none: A one-off markup detail of this renderer; no rule kind distinguishes it from intended adjacency.
2026-11-10T01:50:35Z s=b56c5c03 DONE fp=ea9849b037a9 cov=75.6% paths=ARCH.md,CHANGELOG.md,README.md,bench/recall.mjs(+59)
2026-11-10T01:50:35Z s=b56c5c03 FINDING docs/index.html:footer Demo data learn=none: Glyph ambiguity of a label is a copy judgment, not a mechanically checkable invariant.
2026-11-10T01:55:57Z s=b56c5c03 FAIL lint
2026-11-10T02:01:23Z s=b56c5c03 FAIL tests.e2e.1
2026-11-10T02:04:56Z s=b56c5c03 DONE fp=9a438868141f cov=75.6% paths=.oxlintrc.json,ARCH.md,CHANGELOG.md,README.md(+65)
2026-11-10T02:04:56Z s=b56c5c03 FINDING .oxlintrc.json:ignorePatterns learn=none: The lint gate itself catches a new unignored vendored file; nothing further to mechanize.
2026-11-10T02:04:56Z s=b56c5c03 FINDING docs/assets/demo.css:@container mk-header learn=none: Thresholds depend on the header's content; site.mjs already exercises the header controls at 1280 px.
2026-11-10T02:04:56Z s=b56c5c03 FINDING scripts/haystack-fixture.mjs:defuss-brotli learn=memory: CLI_GIST fixture line updated to the .json.br path and byte-identical rebuild.
2026-11-10T02:13:50Z s=b56c5c03 DONE fp=e79cd7d9cd32 cov=75.6% paths=.oxlintrc.json,ARCH.md,CHANGELOG.md,README.md(+65)
2026-11-10T02:25:43Z s=b56c5c03 DONE fp=84e616d019f8 cov=75.6% paths=.oxlintrc.json,ARCH.md,CHANGELOG.md,README.md(+65)
2026-11-10T02:25:43Z s=b56c5c03 FINDING docs/assets/search-worker.js:load decoder learn=none: file:// loading depends on each browser's policy (Chromium and WebKit block every file:// fetch); no portable automated check.
