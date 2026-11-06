import { c as createAnalyzer, n as normalizeToken, a as tokenize } from './analyzer-CQNufUmw.js';
import { s as stem_es } from './es-CmaGYjmH.js';
import { s as spanishMetaphone } from './es-C7gyuI5X.js';
import './stemmer-CH2wT9oZ.js';

const DEFAULT_STOPWORDS_ES = [
  "a",
  "al",
  "con",
  "de",
  "del",
  "en",
  "la",
  "las",
  "le",
  "los",
  "el",
  "ella",
  "ellas",
  "ellos",
  "es",
  "ese",
  "eso",
  "esta",
  "este",
  "lo",
  "me",
  "mi",
  "no",
  "nos",
  "o",
  "para",
  "por",
  "que",
  "se",
  "su",
  "sus",
  "te",
  "tu",
  "un",
  "una",
  "uno",
  "y",
  "yo",
  "\xE9l"
];

const es = createAnalyzer({
  id: "es-lexicalsearch-v1",
  language: "es",
  tokenize,
  normalize: normalizeToken,
  stem: stem_es,
  stopWords: DEFAULT_STOPWORDS_ES,
  phonetic: spanishMetaphone
});

export { es as default, es };
