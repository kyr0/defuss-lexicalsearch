import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Regenerates src/stem/<code>.ts from a Snowball checkout with a built compiler:
//   git clone --branch v3.1.1 https://github.com/snowballstem/snowball && make -C snowball snowball
//   node scripts/snowball.mjs <path to snowball>
// The compiler's JavaScript output is turned into TypeScript on the runtime in src/stem/snowball.ts: JSDoc types become
// annotations, the anonymous default class becomes a named class, and each module exports one stem_<code> function.
// VERIFIED: every generated stemmer reproduced snowball-data's output.txt for its whole voc.txt (commit 019921c, 9.6 million
// words, 0 mismatches); test/languages.test.mjs keeps samples, so a regeneration is checked against them.
const root = fileURLToPath(new URL('../', import.meta.url));
const LANGUAGES = {
  ar: 'arabic', hi: 'hindi', id: 'indonesian', it: 'italian', nl: 'dutch', pl: 'polish', pt: 'portuguese', ru: 'russian', tr: 'turkish',
};
const LICENSE = '// BSD-3-Clause, Copyright (c) 2001 Dr Martin Porter, (c) 2004,2005 Richard Boulton, (c) 2013 Yoshiki Shibukawa,\n'
  + '// (c) 2006-2025 Olly Betts; the full license text is in snowball.ts.';

const CHECKED = '// VERIFIED: reproduces the output.txt of snowball-data (commit 019921c) for every word of its voc.txt;\n'
  + '// test/languages.test.mjs keeps samples.';

const TYPES = { number: 'number', boolean: 'boolean', string: 'string', 'Array<number>': 'readonly number[]', 'Array<string>': 'readonly string[]' };
const type = name => TYPES[name] ?? (() => { throw new Error(`unknown JSDoc type ${name}`); })();

export function convert(js, language, code) {
  const name = `${language[0].toUpperCase()}${language.slice(1)}Stemmer`;
  let ts = js
    .replace(/^\/\/ Generated from (\S+) by Snowball (\S+) - https:\/\/snowballstem\.org\/\n/, (_, file, version) =>
      `// Generated from ${file} by Snowball ${version} (https://snowballstem.org/) with scripts/snowball.mjs; do not edit.\n${LICENSE}\n${CHECKED}\n// oxlint-disable no-unused-labels\n`)
    .replace(/^\s*\/\/ deno-lint-ignore.*\n/gm, '')
    .replace(/^import B from '\.\/base-stemmer\.js'\n/m, '')
    .replace(/^(const|let) \/\*\* ([\w<>]+) \*\/ (\w+)/gm, (_, keyword, jsdoc, id) => `${keyword} ${id}: ${type(jsdoc)}`)
    .replace(/\b(const|let) \/\*\* ([\w<>]+) \*\/ (\w+)/g, (_, keyword, jsdoc, id) => `${keyword} ${id}: ${type(jsdoc)}`)
    .replace(/(#\w+)\/\*\* (\w+) \*\/ =/g, (_, id, jsdoc) => `${id}: ${type(jsdoc)} =`)
    .replace(/^const (a_\d+) = \[/gm, 'const $1: readonly Among[] = [')
    .replace(/^\s*\/\*\* @return \{boolean\} \*\/\n/gm, '')
    .replace(/\/\*\*@return\{string\}\*\/\n(\s*)stem\(\/\*\*string\*\/input\) \{/, '$1stem(input: string): string {')
    .replace(/\n\s*stemWord = this\.stem;\n/, '\n')
    .replace(/^export default class extends B \{/m, `class ${name} extends SnowballStemmer {`);
  const header = ts.indexOf('\n// oxlint-disable no-unused-labels\n') + '\n// oxlint-disable no-unused-labels\n'.length;
  ts = `${ts.slice(0, header)}import { SnowballStemmer, type Among } from './snowball';\n${ts.slice(header)}`;
  ts = `${ts.trimEnd()}\n\nconst stemmer = new ${name}();\n\n/** ${name.replace('Stemmer', '')} Snowball stem of a lowercase word. */\nexport const stem_${code} = (word: string): string => stemmer.stem(word);\n`;
  if (/\/\*\*\s*[\w<>]+\s*\*\//.test(ts) || ts.includes('export default') || ts.includes('base-stemmer')) {
    throw new Error(`${language}: unconverted JavaScript remains`);
  }
  return ts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const snowball = process.argv[2];
  if (!snowball) throw new Error('usage: node scripts/snowball.mjs <snowball checkout with a built compiler>');
  const out = mkdtempSync(join(tmpdir(), 'snowball-'));
  for (const [code, language] of Object.entries(LANGUAGES)) {
    execFileSync(join(snowball, 'snowball'), [join(snowball, 'algorithms', `${language}.sbl`), '-js', '-o', join(out, language)]);
    writeFileSync(join(root, 'src/stem', `${code}.ts`), convert(readFileSync(join(out, `${language}.js`), 'utf8'), language, code));
    console.log(`src/stem/${code}.ts ← ${language}.sbl`);
  }
}
