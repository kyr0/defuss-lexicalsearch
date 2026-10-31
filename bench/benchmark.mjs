import { performance } from 'node:perf_hooks';
import { cpus, platform, arch } from 'node:os';
import { mkdir, writeFile } from 'node:fs/promises';
import { LexicalSearch } from '../dist/index.js';

const n = Number(process.argv[2] ?? 10000);
if (!Number.isSafeInteger(n) || n < 1000 || n > 100000) throw new Error('Document count must be 1000–100000');
const documents = Array.from({ length: n }, (_, i) => ({
  id: `doc-${String(i).padStart(6, '0')}`,
  fields: { title: `Project item${i} topic${i % 997}`, body: `local search engine document topic${i % 997} group${i % 31} red fox reference${i}` },
  metadata: { group: i % 31 },
}));
const index = new LexicalSearch({ fields: { title: { weight: 2 }, body: {} } });
let start = performance.now(); index.addAll(documents); const buildMs = performance.now() - start;
const queries = [
  ['rare exact', 'item999', {}], ['common exact', 'search', {}],
  ['prefix', 'item999', { prefix: true }], ['fuzzy', 'topix123', { fuzzy: 1 }],
  ['phrase', '"red fox" topic123', {}],
  ['filtered', 'search', { filter: m => m.group === 7 }],
];
const results = [];
for (const [name, query, options] of queries) {
  for (let i = 0; i < 5; i++) index.search(query, options);
  const durations = [];
  for (let i = 0; i < 30; i++) { const t = performance.now(); index.search(query, options); durations.push(performance.now() - t); }
  durations.sort((a, b) => a - b);
  const measured = index.searchWithStats(query, options);
  results.push({ name, query, medianMs: durations[15], p95Ms: durations[28], total: measured.total, ...measured.stats });
}
start = performance.now(); const snapshot = index.serialize(); const serializeMs = performance.now() - start;
start = performance.now(); const restored = LexicalSearch.fromJSON(snapshot); const restoreMs = performance.now() - start;
if (JSON.stringify(restored.search('topic123')) !== JSON.stringify(index.search('topic123'))) throw new Error('Restore mismatch');
const report = {
  kind: 'synthetic smoke benchmark; not a retrieval-quality benchmark or production SLA',
  node: process.version, platform: `${platform()} ${arch()}`, cpu: cpus()[0]?.model, documents: n,
  buildMs, serializeMs, restoreMs, snapshotBytes: Buffer.byteLength(snapshot),
  heapUsedBytes: process.memoryUsage().heapUsed, maxRssKiB: process.resourceUsage().maxRSS,
  memoryNote: 'Includes source documents, original index, serialized snapshot and restored index; not isolated index memory.',
  queries: results,
};
const output = new URL(`../output/bench/results-${n}.json`, import.meta.url);
await mkdir(new URL('.', output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
