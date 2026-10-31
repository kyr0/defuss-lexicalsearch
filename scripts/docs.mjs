import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

// Generates the website's built parts in docs/ (GitHub Pages serves that folder as is, without a build step):
// assets/lib/ is the package's ESM build, which the search worker imports natively, and data/manifest.json holds the
// figures the page shows. e2e passes the installed package's dist/, so the site runs the packed artifact.
// VERIFIED: scripts/site.mjs compares every figure on the page with this manifest.
const root = fileURLToPath(new URL('../', import.meta.url));
const CORPUS = 'defuss-shadcn-docs.json.gz';

/** An ESM entry plus every file it reaches through relative static or dynamic imports. */
const reachable = async (dir, entry, seen = new Set()) => {
  if (seen.has(entry)) return seen;
  seen.add(entry);
  for (const [, file] of (await readFile(join(dir, entry), 'utf8')).matchAll(/(?:from|import)\s*\(?\s*['"]\.\/([^'"]+)['"]/g)) await reachable(dir, file, seen);
  return seen;
};

export async function buildSite(dist = join(root, 'dist')) {
  const lib = join(root, 'docs/assets/lib');
  await rm(lib, { recursive: true, force: true });
  await mkdir(lib, { recursive: true });
  const files = (await readdir(dist)).filter(file => file.endsWith('.js')).sort();
  for (const file of files) await copyFile(join(dist, file), join(lib, file));
  const core = await Promise.all([...await reachable(dist, 'index.js')].map(file => readFile(join(dist, file))));
  const packed = await readFile(join(root, 'docs/data', CORPUS));
  const corpus = JSON.parse(gunzipSync(packed));
  const { version } = JSON.parse(await readFile(join(dist, '../package.json'), 'utf8'));
  const manifest = {
    version,
    library: { files: files.length, coreBytes: core.reduce((n, bytes) => n + bytes.length, 0), coreGzipBytes: core.reduce((n, bytes) => n + gzipSync(bytes, { level: 9 }).length, 0) },
    corpus: {
      file: CORPUS, source: corpus.source, pages: corpus.documents.length, bytes: packed.length,
      textBytes: corpus.documents.reduce((n, { text }) => n + Buffer.byteLength(text), 0),
    },
  };
  await writeFile(join(root, 'docs/data/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildSite(), null, 2));
