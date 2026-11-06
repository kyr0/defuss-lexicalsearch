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

const escape = text => text.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
export const percent = (share, digits = 0) => `${(100 * share).toFixed(digits)}%`;
const ext = '<svg class="ls-icon ls-ext" aria-hidden="true"><use href="#i-external"/></svg><span class="sr-only"> (opens in a new tab)</span>';

/** The strategies of bench/recall.mjs the website shows as tabs; the README's guess table also compares 'guessed-field'. */
export const RECALL_TABS = ['known', 'guessed', 'fields', 'typing', 'default'];

/**
 * The "Measured, not promised" section: R@5 per query language for each strategy in RECALL_TABS, one tab per
 * strategy, languages sorted by R@5. Static markup, so the figures read right without JavaScript.
 */
export function renderRecall(recall) {
  const strategy = id => recall.strategies.find(s => s.id === id);
  const order = RECALL_TABS.map(strategy);
  const codes = Object.keys(recall.languages);
  const tabs = order.map((s, i) => `<button class="tab-trigger" role="tab" aria-selected="${i === 0}" aria-controls="recall-panel-${s.id}" id="recall-tab-${s.id}"${i ? ' tabindex="-1"' : ''}>${escape(s.name)}</button>`);
  const panels = order.map((s, i) => {
    const sorted = [...codes].sort((a, b) => s.languages[b] - s.languages[a] || codes.indexOf(a) - codes.indexOf(b));
    const bars = sorted.map(code => {
      const { name, method } = recall.languages[code];
      const badge = s.id === 'default' ? '' : ` <span class="badge" data-variant="outline" data-size="xs">${escape(method)}</span>`;
      const value = Math.round(100 * s.languages[code]);
      return `<div class="progress-field" data-recall="${code}">
                <div class="progress-header"><span class="progress-label" id="r5-${s.id}-${code}">${escape(name)}${badge}</span><output class="progress-value" for="r5-bar-${s.id}-${code}">${value}%</output></div>
                <progress class="progress" id="r5-bar-${s.id}-${code}" data-size="xs" data-tone="auto" value="${value}" max="100" aria-labelledby="r5-${s.id}-${code}"></progress>
              </div>`;
    }).join('\n              ');
    return `<div class="tab-content" role="tabpanel" id="recall-panel-${s.id}" aria-labelledby="recall-tab-${s.id}" tabindex="0"${i ? ' hidden' : ''}>
            <p class="ls-recall-note">${escape(s.description)} Mean R@5: <strong data-recall-mean="${s.id}">${percent(s.r5, 1)}</strong>.</p>
            <div class="ls-recall-list">
              ${bars}
            </div>
          </div>`;
  });
  const { dataset } = recall;
  // One tile for three languages: equal values print as is, unequal ones as the lowest with "at least".
  const top = ['eng_Latn', 'fra_Latn', 'rus_Cyrl'].map(code => strategy('known').languages[code]);
  return `<!-- recall:start -->
  <!-- Generated by scripts/docs.mjs from docs/data/recall.json (bench/recall.mjs); run \`make docs\` instead of editing. -->
  <section id="recall" class="container ls-section parallax-reveal" aria-labelledby="recall-title">
    <section class="mk-stats" style="width:100%">
      <div class="mk-stats-layout">
        <div class="mk-stats-copy">
          <div class="mk-stats-head">
            <h2 class="mk-stats-title" id="recall-title">Measured, not promised<sup class="ls-footnote-mark">*</sup></h2>
            <p class="mk-stats-desc">Each of the ${dataset.passages.toLocaleString('en')} passages of <a href="https://github.com/kyr0/tiny-embedding-bench/tree/main/datasets/tiny-embedding-bench-v1" target="_blank" rel="noopener">tiny-embedding-bench-v1${ext}</a> is indexed once, ${dataset.questions.toLocaleString('en')} questions in ${codes.length} languages search them, and a question scores when its gold passage, in the question's language, ranks in the top 5. The same haystack measures <a href="https://github.com/kyr0/defuss-vectorsearch" target="_blank" rel="noopener">defuss-vectorsearch${ext}</a>, so a question also competes with the ${codes.length - 1} translations of its gold passage. From <code>make bench</code>, version ${escape(recall.version)}.</p>
          </div>
          <div class="mk-stats-grid">
            <div class="mk-stat" data-recall-stat="known"><span class="mk-stat-value">${percent(strategy('known').r5, 1)}</span><span class="mk-stat-label">mean R@5 over ${codes.length} languages when the question's language is known</span></div>
            <div class="mk-stat" data-recall-stat="fields"><span class="mk-stat-value">${percent(strategy('fields').r5, 1)}</span><span class="mk-stat-label">when each question searches all ${codes.length} language fields</span></div>
            <div class="mk-stat" data-recall-stat="en-fr-ru"><span class="mk-stat-value">${percent(Math.min(...top))}</span><span class="mk-stat-label">${top.every(value => value === top[0]) ? '' : 'at least '}R@5 for English, French, and Russian questions with the <code>en</code>, <code>fr</code>, and <code>ru</code> analyzers</span><a href="https://github.com/kyr0/defuss-lexicalsearch#retrieval-quality-by-language" class="btn mk-stat-link" data-variant="link" data-size="default" target="_blank" rel="noopener">All languages${ext}</a></div>
            <div class="mk-stat" data-recall-stat="default"><span class="mk-stat-value">${percent(strategy('default').r5, 1)}</span><span class="mk-stat-label">with the default analyzer and no language setup</span></div>
          </div>
          <p class="ls-footnote">* Deterministic: the same build and runtime always return the same ranks. Measured on Node.js ${escape(recall.node.slice(1))}; word segmentation for Japanese, Chinese and Thai follows the runtime's ICU data (here ${escape(recall.icu)}).</p>
        </div>
        <figure class="mk-stats-media card ls-recall">
          <figcaption class="card-header"><h3 class="card-title">R@5 by query language</h3><p class="card-description">Share of a language's ${dataset.perLanguage} questions whose gold passage ranks in the top 5 of ${dataset.passages.toLocaleString('en')}. The badge names how the language's analyzer works.</p></figcaption>
          <div class="card-content tabs ls-recall-tabs">
            <div class="tab-list" role="tablist" aria-label="Search strategy" id="recall-tabs">
              ${tabs.join('\n              ')}
            </div>
          ${panels.join('\n          ')}
          </div>
        </figure>
      </div>
    </section>
  </section>
  <!-- recall:end -->`;
}

/** The README's R@5 table: one row per language, one column per strategy, sorted like the website's first tab. */
export function renderRecallTable(recall) {
  const order = ['known', 'fields', 'typing', 'default'].map(id => recall.strategies.find(s => s.id === id));
  const codes = Object.keys(recall.languages).sort((a, b) => order[0].languages[b] - order[0].languages[a] || a.localeCompare(b));
  const row = cells => `| ${cells.join(' | ')} |`;
  return [
    '<!-- recall-table:start -->',
    row(['Language', 'Entry', 'Analysis', ...order.map(s => s.name)]),
    row(['---', '---', '---', ...order.map(() => '---:')]),
    ...codes.map(code => { const { name, entry, method } = recall.languages[code]; return row([name, `\`${entry}\``, method, ...order.map(s => percent(s.languages[code]))]); }),
    row(['**Mean**', '', '', ...order.map(s => `**${percent(s.r5, 1)}**`)]),
    '<!-- recall-table:end -->',
  ].join('\n');
}

/** The README's table for a guessed query language: mean R@1 and R@5 of searching all fields, the guessed field only,
 * the language option and the known field. */
export function renderGuessTable(recall) {
  const rows = [['fields', 'Language unknown: all 20 fields'], ['guessed-field', 'Guessed language: only that field'],
    ['guessed', 'Guessed language: `language`'], ['known', 'Known language: only that field']];
  const { dataset, guessed } = recall;
  return [
    '<!-- language-guess:start -->',
    `| tiny-embedding-bench-v1, ${dataset.questions.toLocaleString('en')} questions | R@1 | R@5 |`,
    '| --- | ---: | ---: |',
    ...rows.map(([id, label]) => { const s = recall.strategies.find(x => x.id === id); return `| ${label} | ${percent(s.r1, 1)} | ${percent(s.r5, 1)} |`; }),
    '',
    `${guessed.identifier} guessed ${guessed.correct.toLocaleString('en')} of the ${dataset.questions.toLocaleString('en')} questions' languages right.`,
    '<!-- language-guess:end -->',
  ].join('\n');
}

const METHODS = { Snowball: 'Snowball stemming', segmenter: 'Word segmentation', bigrams: 'Syllable bigrams', trigrams: 'Words plus trigrams', 'tone folding': 'Tone mark folding' };

/** The README's languages-at-a-glance block: one row per kind of analysis, with the R@5 range of its languages. */
export function renderLanguageGlance(recall) {
  const known = recall.strategies.find(s => s.id === 'known'), plain = recall.strategies.find(s => s.id === 'default');
  const codes = Object.keys(recall.languages);
  if (codes.some(code => !METHODS[recall.languages[code].method])) throw new Error('a language method lacks a README label');
  const rows = Object.entries(METHODS).map(([method, label]) => {
    const group = codes.filter(code => recall.languages[code].method === method);
    if (!group.length) throw new Error(`no language uses ${method}`);
    const values = group.map(code => known.languages[code]);
    const low = Math.min(...values), high = Math.max(...values);
    return `| ${label} | ${group.map(code => `\`${recall.languages[code].entry}\``).join(' ')} | ${low === high ? percent(low) : `${percent(low).slice(0, -1)}–${percent(high)}`} |`;
  });
  return [
    '<!-- languages:start -->',
    '| Analysis | Entries | R@5, language known |',
    '| --- | --- | ---: |',
    ...rows,
    '',
    `Mean R@5 over all ${codes.length} languages: **${percent(known.r5, 1)}** when each question searches its language's field, **${percent(plain.r5, 1)}** with the default analyzer and no language setup.`,
    '<!-- languages:end -->',
  ].join('\n');
}

/** Replaces the generated recall parts of docs/index.html and README.md; returns the files that changed. */
export async function writeRecall(recall) {
  const changed = [];
  for (const [file, pattern, render] of [
    ['docs/index.html', /<!-- recall:start -->[\s\S]*<!-- recall:end -->/, renderRecall],
    ['README.md', /<!-- recall-table:start -->[\s\S]*<!-- recall-table:end -->/, renderRecallTable],
    ['README.md', /<!-- languages:start -->[\s\S]*<!-- languages:end -->/, renderLanguageGlance],
    ['README.md', /<!-- language-guess:start -->[\s\S]*<!-- language-guess:end -->/, renderGuessTable],
  ]) {
    const text = await readFile(join(root, file), 'utf8');
    if (!pattern.test(text)) throw new Error(`${file} lacks the generated recall markers`);
    const next = text.replace(pattern, () => render(recall));
    if (next !== text) { await writeFile(join(root, file), next); changed.push(file); }
  }
  return changed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await buildSite(), null, 2));
  await writeRecall(JSON.parse(await readFile(join(root, 'docs/data/recall.json'), 'utf8')));
}
