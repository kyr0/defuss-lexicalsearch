import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Every ```ts block of README.md runs as written against the built package, which Node resolves by package
// self-reference, and prints what its `console.log(...); // <output>` comments say. A ```ts no-run block (one that
// needs the network) is skipped. Why run the page instead of copying its examples into tests: a copy drifts.
const root = new URL('../', import.meta.url);
const work = new URL('tmp/readme-test/', root);
const readme = await readFile(new URL('README.md', root), 'utf8');
const blocks = [...readme.matchAll(/^```ts\n([\s\S]*?)^```$/gm)].map(match => match[1]);

test('README examples run and print the output their comments state', async () => {
  assert.ok(blocks.length >= 5, `expected the README's runnable examples, found ${blocks.length}`);
  await rm(work, { recursive: true, force: true });
  await mkdir(work, { recursive: true });
  for (const [i, code] of blocks.entries()) {
    const file = fileURLToPath(new URL(`example-${i + 1}.ts`, work));
    await writeFile(file, code);
    const expected = [...code.matchAll(/^\s*console\.log\(.*\); \/\/ (.*)$/gm)].map(match => match[1]);
    // The examples run on the runtime that runs this test. bun's console quotes strings in arrays with ", Node's with ';
    // the comments show Node's form.
    const output = execFileSync(process.execPath, ['--no-warnings', file], { encoding: 'utf8' }).trimEnd();
    const printed = process.versions.bun ? output.replaceAll('"', "'") : output;
    assert.deepEqual(printed ? printed.split('\n') : [], expected, `README example ${i + 1}:\n${code}`);
  }
});
