import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

// Snapshots defuss-shadcn's MDX documentation at one commit into docs/data/: the website demo's corpus and the haystack
// of test/haystack.test.mjs.
// The fixture embeds the source URL and its MIT license, whose notice must accompany copies.
// VERIFIED: rebuilding the same commit yields a byte-identical file (sorted paths, gzip without timestamp).
const commit = process.argv[2];
if (!/^[0-9a-f]{40}$/.test(commit ?? '')) throw new Error('Usage: node scripts/haystack-fixture.mjs <40-hex defuss-shadcn commit>');
const work = await mkdtemp(join(tmpdir(), 'haystack-'));
try {
  const archive = join(work, 'repo.tgz'), root = `defuss-shadcn-${commit}`;
  execFileSync('curl', ['-fsSL', '-o', archive, `https://codeload.github.com/kyr0/defuss-shadcn/tar.gz/${commit}`]);
  execFileSync('tar', ['-xzf', archive, '-C', work, `${root}/LICENSE`, `${root}/src/documentation`]);
  const docs = join(work, root, 'src/documentation');
  const paths = (await readdir(docs, { recursive: true })).filter(path => path.endsWith('.mdx')).sort();
  const fixture = {
    source: `https://github.com/kyr0/defuss-shadcn/tree/${commit}/src/documentation`,
    license: await readFile(join(work, root, 'LICENSE'), 'utf8'),
    documents: await Promise.all(paths.map(async path => ({ path, text: await readFile(join(docs, path), 'utf8') }))),
  };
  const output = new URL('../docs/data/', import.meta.url);
  await mkdir(output, { recursive: true });
  await writeFile(new URL('defuss-shadcn-docs.json.gz', output), gzipSync(JSON.stringify(fixture), { level: 9 }));
  console.log(`${fixture.documents.length} MDX documents from ${fixture.source}`);
} finally { await rm(work, { recursive: true, force: true }); }
