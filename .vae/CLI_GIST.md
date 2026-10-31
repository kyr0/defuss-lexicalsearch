# CLI gist

<!-- Commands future agents need that the Makefile verbs do not cover (setup, env, data, deploy):
- VERIFIED[purpose] `cmd`: only after an observed success
- UNKNOWN[purpose] BC gap
Budget 2 KiB (`vae.py doctor --repo .`); entries are injected at session start. -->
- VERIFIED[install@claude-sandbox] `BUN_TMPDIR=$TMPDIR BUN_INSTALL_CACHE_DIR=$TMPDIR/bun-cache bun install` BC plain `bun install` fails with EPERM on its tempdir there
- VERIFIED[e2e@claude-sandbox] `make e2e` needs local port binding (Chromium serves examples from 127.0.0.1) BC sandbox gives listen EPERM; run unsandboxed or allowLocalBinding
- VERIFIED[typecheck] `bun run lint` | `node_modules/.bin/tsc --noEmit` BC `npx tsc --noEmit` here drops `--noEmit` (npm config) and writes tsc output into dist/
- VERIFIED[fixture] `node scripts/haystack-fixture.mjs <defuss-shadcn commit>` rebuilds docs/data/defuss-shadcn-docs.json.gz (needs codeload.github.com)
- VERIFIED[site] `make e2e` also drives the website (docs/) in Chromium and needs cdn.jsdelivr.net for defuss-shadcn; `make docs` refreshes docs/assets/lib and docs/data/manifest.json after a library change BC scripts/site.mjs fails on a figure that differs from the manifest
- VERIFIED[snowball@macOS-SDK27] `SDKROOT=/Library/Developer/CommandLineTools/SDKs/MacOSX26.sdk make snowball` in a v3.1.1 checkout, then `node scripts/snowball.mjs <checkout>` BC SDK 27's libSystem.tbd fails the link with "unknown architecture"
- VERIFIED[recall] `make docs` runs `bench/recall.mjs --site` (needs github.com once to fetch input/tiny-embedding-bench-v1.json) BC scripts/site.mjs and test/readme.test.mjs fail when docs/data/recall.json, the page or README table drift
