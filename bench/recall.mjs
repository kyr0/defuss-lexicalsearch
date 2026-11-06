import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { arch, cpus, platform } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { load as loadLanguageIdentifier } from 'defuss-lid/packs/major_20';

// Retrieval quality per query language on tiny-embedding-bench-v1, the benchmark defuss-vectorsearch reports:
// 100 Belebele passages and 50 questions, each in 20 languages, one gold passage per question. All 2,000 passages form
// one index, so a question also competes with the 19 translations of its gold passage; the target is the gold passage
// in the question's language. R@k is the share of a language's 50 questions whose target ranks within the top k.
// The guessed-language strategies take each question's language from defuss-lid's major_20 pack, which covers the same
// 20 languages, so they measure what an application gets when it has to guess.
// Writes output/bench/recall.json; `--site` also writes docs/data/recall.json, which the website renders.
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = process.argv.find(arg => arg.startsWith('--dist='))?.slice(7) ?? join(root, 'dist');
const DATASET_URL = 'https://github.com/kyr0/tiny-embedding-bench/raw/refs/heads/main/datasets/tiny-embedding-bench-v1/dataset.json';
// VERIFIED: the MANIFEST.json of tiny-embedding-bench-v1 lists this hash, and defuss-vectorsearch pins the same one.
const DATASET_SHA256 = '3d09d3653b72cf19c5226cd134bdd7d92ac31f2822cf45bc60879e7a95a75e6d';
const DATASET = join(root, 'input/tiny-embedding-bench-v1.json');
const K = [1, 5, 10];

/** Dataset language → package entry, display name and how the entry analyzes text. */
export const LANGUAGES = {
  eng_Latn: { entry: 'en', name: 'English', method: 'Snowball' },
  deu_Latn: { entry: 'de', name: 'German', method: 'Snowball' },
  fra_Latn: { entry: 'fr', name: 'French', method: 'Snowball' },
  spa_Latn: { entry: 'es', name: 'Spanish', method: 'Snowball' },
  por_Latn: { entry: 'pt', name: 'Portuguese', method: 'Snowball' },
  ita_Latn: { entry: 'it', name: 'Italian', method: 'Snowball' },
  nld_Latn: { entry: 'nl', name: 'Dutch', method: 'Snowball' },
  pol_Latn: { entry: 'pl', name: 'Polish', method: 'Snowball' },
  rus_Cyrl: { entry: 'ru', name: 'Russian', method: 'Snowball' },
  tur_Latn: { entry: 'tr', name: 'Turkish', method: 'Snowball' },
  arb_Arab: { entry: 'ar', name: 'Arabic', method: 'Snowball' },
  hin_Deva: { entry: 'hi', name: 'Hindi', method: 'Snowball' },
  ben_Beng: { entry: 'bn', name: 'Bangla', method: 'trigrams' },
  urd_Arab: { entry: 'ur', name: 'Urdu', method: 'trigrams' },
  ind_Latn: { entry: 'id', name: 'Indonesian', method: 'Snowball' },
  vie_Latn: { entry: 'vi', name: 'Vietnamese', method: 'tone folding' },
  tha_Thai: { entry: 'th', name: 'Thai', method: 'segmenter' },
  zho_Hans: { entry: 'zh', name: 'Chinese', method: 'segmenter' },
  jpn_Jpan: { entry: 'ja', name: 'Japanese', method: 'segmenter' },
  kor_Hang: { entry: 'ko', name: 'Korean', method: 'bigrams' },
};

/** Each strategy indexes all 2,000 passages; `fields` and `options` shape the search of one question. */
export const STRATEGIES = [
  { id: 'default', name: 'Default analyzer', perLanguage: false, own: false, options: {},
    description: 'No language configuration: one field with unicodeAnalyzer, which splits words at spaces and punctuation.' },
  { id: 'fields', name: 'Language fields', perLanguage: true, own: false, options: {},
    description: 'One field per language with its analyzer; a question searches all 20 fields, so its language need not be known.' },
  { id: 'known', name: 'Known language', perLanguage: true, own: true, options: {},
    description: "One field per language with its analyzer; a question searches its own language's field." },
  { id: 'guessed', name: 'Guessed language', perLanguage: true, guess: 'boost', options: {},
    description: "One field per language with its analyzer; a question searches all 20 fields with the language defuss-lid guesses as the language option, which weighs that language's field three times more." },
  { id: 'guessed-field', name: 'Guessed field only', perLanguage: true, guess: 'field', options: {},
    description: "One field per language with its analyzer; a question searches only the field of the language defuss-lid guesses." },
  { id: 'typing', name: 'As you type', perLanguage: true, own: true, options: { prefix: true, substring: true, fuzzy: true, transpositions: true },
    description: "Known language plus the website demo's defaults: completion, inside-word matching and typo tolerance." },
];

async function loadDataset() {
  let bytes;
  try { bytes = await readFile(DATASET); } catch {
    const response = await fetch(DATASET_URL);
    if (!response.ok) throw new Error(`${DATASET_URL}: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== DATASET_SHA256) throw new Error(`downloaded dataset SHA-256 ${actual} !== pinned ${DATASET_SHA256}`);
    await mkdir(join(root, 'input'), { recursive: true });
    await writeFile(DATASET, bytes);
  }
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== DATASET_SHA256) throw new Error(`${DATASET} SHA-256 ${actual} !== pinned ${DATASET_SHA256}; delete it to download again`);
  const data = JSON.parse(bytes.toString('utf8'));
  if (data.schema !== 'tiny-multilingual-retrieval.v1' || data.languages.join() !== Object.keys(LANGUAGES).join()) {
    throw new Error('unexpected dataset schema or language list');
  }
  return data;
}

export async function measureRecall() {
  const data = await loadDataset();
  const { LexicalSearch, unicodeAnalyzer } = await import(join(dist, 'index.js'));
  const analyzers = Object.fromEntries(await Promise.all(Object.entries(LANGUAGES).map(async ([code, { entry }]) =>
    [code, (await import(join(dist, `${entry}.js`))).default])));
  const languages = data.languages;
  const groups = new Map(data.corpus.map((passage, group) => [passage.id, group]));
  const gold = new Map(data.qrels.map(([query, passage]) => [query, groups.get(passage)]));
  const passages = data.corpus.flatMap((passage, group) => passage.text.map((text, language) => ({ id: `${group}:${language}`, text, language })));
  const questions = data.queries.flatMap(query => query.text.map((text, language) => ({ text, language, target: `${gold.get(query.id)}:${language}` })));
  // One guess per question, made once: the identifier's time is not part of the search time below.
  const identifier = await loadLanguageIdentifier();
  const guesses = questions.map(({ text }) => identifier.predict(text)[0]?.language);
  identifier.dispose();
  const fieldOf = Object.fromEntries(languages.map(code => [LANGUAGES[code].entry, code]));
  const { version: lidVersion } = JSON.parse(await readFile(fileURLToPath(import.meta.resolve('defuss-lid/package.json')), 'utf8'));
  const guessed = { identifier: `defuss-lid ${lidVersion} major_20`, correct: guesses.filter((guess, i) => guess === LANGUAGES[languages[questions[i].language]].entry).length };
  const route = (strategy, language, guess) => strategy.own ? { fields: [languages[language]] }
    : strategy.guess === 'boost' ? { language: guess }
    : strategy.guess === 'field' && fieldOf[guess] ? { fields: [fieldOf[guess]] } : {};

  const strategies = [];
  for (const strategy of STRATEGIES) {
    const fields = strategy.perLanguage ? Object.fromEntries(languages.map(code => [code, { analyzer: analyzers[code] }])) : { text: { analyzer: unicodeAnalyzer } };
    // Without segmentation a Thai sentence is one token of up to 153 code points, above the default limit of 128.
    const index = new LexicalSearch({ fields, maxTokenLength: 1024 });
    let start = performance.now();
    index.addAll(passages.map(({ id, text, language }) => ({ id, fields: { [strategy.perLanguage ? languages[language] : 'text']: text } })));
    const indexMs = performance.now() - start;
    const hits = languages.map(() => K.map(() => 0));
    start = performance.now();
    for (const [i, { text, language, target }] of questions.entries()) {
      const ranked = index.search(text, { ...strategy.options, limit: Math.max(...K), ...route(strategy, language, guesses[i]) });
      const rank = ranked.findIndex(hit => hit.id === target) + 1;
      K.forEach((k, i) => { if (rank > 0 && rank <= k) hits[language][i]++; });
    }
    const queryMs = (performance.now() - start) / questions.length;
    const perLanguage = Object.fromEntries(languages.map((code, language) => [code,
      Object.fromEntries(K.map((k, i) => [`r${k}`, hits[language][i] / data.queries.length]))]));
    const mean = Object.fromEntries(K.map(k => [`r${k}`, languages.reduce((sum, code) => sum + perLanguage[code][`r${k}`], 0) / languages.length]));
    strategies.push({ id: strategy.id, name: strategy.name, description: strategy.description, options: strategy.options, mean, indexMs, queryMs, languages: perLanguage });
  }
  const { version } = JSON.parse(await readFile(join(dist, '../package.json'), 'utf8'));
  return {
    version, dataset: { name: data.name, url: DATASET_URL, sha256: DATASET_SHA256, passages: passages.length, questions: questions.length, perLanguage: data.queries.length },
    node: process.version, icu: process.versions.icu, platform: `${platform()} ${arch()}`, cpu: cpus()[0]?.model,
    languages: Object.fromEntries(languages.map(code => [code, LANGUAGES[code]])), guessed, strategies,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = await measureRecall();
  await mkdir(join(root, 'output/bench'), { recursive: true });
  await writeFile(join(root, 'output/bench/recall.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (process.argv.includes('--site')) {
    // The website shows R@5 per language, the README also mean R@1; timings vary by machine and stay out of the file.
    const site = {
      version: report.version, dataset: report.dataset, node: report.node, icu: report.icu, languages: report.languages, guessed: report.guessed,
      strategies: report.strategies.map(({ id, name, description, mean, languages }) => ({ id, name, description, r1: mean.r1, r5: mean.r5,
        languages: Object.fromEntries(Object.entries(languages).map(([code, recall]) => [code, recall.r5])) })),
    };
    await writeFile(join(root, 'docs/data/recall.json'), `${JSON.stringify(site, null, 2)}\n`);
  }
  for (const s of report.strategies) {
    console.log(`${s.name.padEnd(18)} R@1 ${(100 * s.mean.r1).toFixed(1)}%  R@5 ${(100 * s.mean.r5).toFixed(1)}%  R@10 ${(100 * s.mean.r10).toFixed(1)}%  index ${s.indexMs.toFixed(0)} ms  query ${s.queryMs.toFixed(2)} ms`);
  }
}
