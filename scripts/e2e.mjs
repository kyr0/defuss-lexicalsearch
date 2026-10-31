import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBrowser } from './browser.mjs';
import { buildSite } from './docs.mjs';
import { runSite } from './site.mjs';

// Consumes the publishable tarball, never the source tree: pack → clean consumer → Node + Chromium → output/e2e/.
// The website gets the installed package's build too (docs/assets/lib), then Chromium drives every section of it.
const root = fileURLToPath(new URL('../', import.meta.url));
const consumer = join(root, 'tmp/e2e-consumer'), output = join(root, 'output/e2e');
const installed = join(consumer, 'node_modules/defuss-lexicalsearch');
const run = (command, args, cwd) => execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

await rm(consumer, { recursive: true, force: true });
await mkdir(consumer, { recursive: true }); await mkdir(output, { recursive: true });
// Runs prepack: typecheck and a clean build, exactly as a publish would.
const tarball = join(consumer, basename(run('bun', ['pm', 'pack', '--destination', consumer, '--quiet'], root).trim().split('\n').at(-1)));
await writeFile(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
run('bun', ['add', tarball], consumer);

const manifest = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'));
assert.equal(Object.keys(manifest.dependencies ?? {}).length, 0, 'zero runtime dependencies');
const files = new Set(run('tar', ['-tzf', tarball], consumer).split('\n').filter(Boolean).map(file => file.replace(/^package\//, '')));
// The tarball holds what a consumer loads and nothing else: a widened `files` list (docs/ alone carries a 1.4 MB
// corpus) or a stray source map fails here.
const shipped = file => ['package.json', 'README.md', 'LICENSE'].includes(file) || /^dist\/.+\.(?:c?js|d\.c?ts)$/.test(file);
assert.deepEqual([...files].filter(file => !shipped(file)), [], 'tarball holds only package.json, README.md, LICENSE and dist/ build files');
// VERIFIED: an unreachable packed file is a stale chunk of an unclean build (an injected dist/analyzer-STALE.js fails here).
const reached = new Set(), queue = JSON.stringify(manifest.exports).match(/\.\/dist\/[^"]+/g).map(path => path.slice(2));
while (queue.length) {
  const file = queue.pop();
  if (reached.has(file)) continue;
  assert.ok(files.has(file), `export target missing from tarball: ${file}`);
  reached.add(file);
  for (const [, specifier] of (await readFile(join(installed, file), 'utf8')).matchAll(/(?:from|import|require)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const target = posix.join(posix.dirname(file), specifier);
    queue.push(/\.d\.c?ts$/.test(file) ? target.replace(/\.(c?)js$/, '.d.$1ts') : target);
  }
}
assert.deepEqual([...files].filter(file => file.startsWith('dist/') && !reached.has(file)), [], 'packed files unreachable from exports');

await writeFile(join(consumer, 'smoke.mjs'), `
  import assert from 'node:assert/strict';
  import { createRequire } from 'node:module';
  import { LexicalSearch, apiSearchPreset } from 'defuss-lexicalsearch';
  import de from 'defuss-lexicalsearch/de';
  import { stem_en } from 'defuss-lexicalsearch/stem';
  import { doubleMetaphone, koelnerPhonetik } from 'defuss-lexicalsearch/phonetic';
  const index = new LexicalSearch({ analyzer: de });
  index.add({ id: 'a', fields: { text: 'Häuser' } });
  assert.equal(index.search('haus')[0].id, 'a');
  assert.equal(stem_en('running'), 'run');
  assert.equal(doubleMetaphone('Smith'), 'SM0|XMT');
  assert.equal(koelnerPhonetik('Breschnew'), '17863');
  const api = new LexicalSearch(apiSearchPreset);
  api.add({ id: 'cpp', fields: { symbol: 'C++', description: 'language' } });
  assert.equal(api.search('C++', { mode: 'exact', fields: ['symbol'] })[0].id, 'cpp');
  assert.equal(LexicalSearch.fromJSON(api.serialize()).search('C++')[0].tier, 'literal');
  const require = createRequire(import.meta.url);
  const cjs = require('defuss-lexicalsearch'), language = require('defuss-lexicalsearch/de');
  const other = new cjs.LexicalSearch({ analyzer: language.de });
  other.add({ id: 'b', fields: { text: 'Häuser' } });
  assert.equal(other.search('haus')[0].id, 'b');
  // Every language entry resolves through the exports map in both module systems and finds an inflected word.
  const samples = { en: ['running', 'run'], de: ['Häuser', 'haus'], es: ['hablando', 'hablar'], fr: ['manger', 'mange'], it: ['biblioteche', 'biblioteca'],
    pt: ['bibliotecas', 'biblioteca'], nl: ['bibliotheken', 'bibliotheek'], pl: ['bibliotekach', 'biblioteka'], ru: ['библиотеке', 'библиотека'],
    tr: ['kitapları', 'kitap'], id: ['membaca', 'baca'], vi: ['hòa', 'hoà'], ar: ['المكتبات', 'المكتبة'], ur: ['کتابیں', 'کتاب'], hi: ['किताबें', 'किताब'],
    bn: ['গ্রন্থাগারে', 'গ্রন্থাগার'], ja: ['東京で猫を見た', '猫'], zh: ['我们在图书馆里读书', '图书馆'], ko: ['도서관에서', '도서관'], th: ['เราอ่านหนังสือในห้องสมุด', 'ห้องสมุด'] };
  for (const [code, [text, query]] of Object.entries(samples)) {
    const { default: esm } = await import('defuss-lexicalsearch/' + code);
    assert.equal(require('defuss-lexicalsearch/' + code)[code].id, esm.id, code);
    const multilingual = new LexicalSearch({ analyzer: esm });
    multilingual.add({ id: code, fields: { text } });
    assert.equal(multilingual.search(query)[0]?.id, code, code + ': ' + query + ' finds ' + text);
  }
`);
// The consumer runs on both supported runtimes: Node.js (engines) and bun (packageManager).
for (const runtime of [process.execPath, 'bun']) run(runtime, [join(consumer, 'smoke.mjs')], consumer);
const browser = await runBrowser({ dist: join(installed, 'dist') });
const siteManifest = await buildSite(join(installed, 'dist'));
const site = await runSite({ output });
await writeFile(join(consumer, 'usage.mjs'), site.usage);
for (const runtime of [process.execPath, 'bun']) assert.equal(run(runtime, [join(consumer, 'usage.mjs')], consumer).trim(), 'dialog', `the website usage snippet runs as printed on ${runtime}`);

const report = {
  finishedAt: new Date().toISOString(), tarball: basename(tarball), bytes: (await stat(tarball)).size, files: files.size,
  node: process.version, bun: run('bun', ['--version'], consumer).trim(), browser, site: { manifest: siteManifest, checks: site.checks },
  passed: ['tarball holds only package.json, README.md, LICENSE and dist/ build files', 'every packed build file reachable from exports', 'ESM/CJS consumer smoke on Node.js and bun', 'Chromium examples, direct imports and module Worker', `website: ${site.checks.length} checks`, 'website usage snippet'],
};
await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`PASS e2e: ${report.tarball} (${report.bytes} bytes, ${report.files} files), Node ${report.node}, bun ${report.bun}, Chromium ${browser}, website ${site.checks.length} checks`);
