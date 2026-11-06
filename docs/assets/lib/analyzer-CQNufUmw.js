const normalizeToken = (token) => token.normalize("NFKC").toLowerCase();
const tokenize = (text) => text.normalize("NFKC").match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu) ?? [];
const unicodeAnalyzer = Object.freeze({
  id: "unicode-nfkc-v1",
  tokenize,
  normalize: normalizeToken
});
const codeAnalyzer = Object.freeze({
  id: "code-nfkc-v1",
  tokenize: (text) => tokenize(text.replace(new RegExp("(\\p{Lu})(\\p{Lu}\\p{Ll})", "gu"), "$1 $2").replace(new RegExp("([\\p{Ll}\\p{N}])(\\p{Lu})", "gu"), "$1 $2")),
  normalize: normalizeToken
});
function primaryLanguage(tag) {
  try {
    return new Intl.Locale(tag).language;
  } catch {
    throw new RangeError(`Invalid BCP 47 language tag: ${String(tag)}`);
  }
}
function createAnalyzer(config) {
  if (!config || typeof config.id !== "string" || !config.id || typeof config.tokenize !== "function") {
    throw new TypeError("Analyzer requires a nonempty versioned id and tokenizer");
  }
  if (config.kind !== void 0 && !["text", "keyword"].includes(config.kind)) throw new TypeError("Invalid analyzer kind");
  if (config.segmented !== void 0 && typeof config.segmented !== "boolean") throw new TypeError("segmented must be boolean");
  if (config.language !== void 0 && (typeof config.language !== "string" || primaryLanguage(config.language) !== config.language)) {
    throw new TypeError("language must be a canonical lowercase ISO 639 code such as de");
  }
  for (const fn of [config.normalize, config.stem, config.phonetic]) {
    if (fn !== void 0 && typeof fn !== "function") throw new TypeError("Invalid analyzer function");
  }
  if (config.stopWords !== void 0 && (!Array.isArray(config.stopWords) || config.stopWords.some((s) => typeof s !== "string"))) {
    throw new TypeError("stopWords must be strings");
  }
  return Object.freeze({ ...config, stopWords: Object.freeze([...config.stopWords ?? []]) });
}
function analyze(text, analyzer, maxLength = Infinity) {
  const raw = analyzer.tokenize(text);
  if (!Array.isArray(raw)) throw new TypeError("Analyzer must return a token array");
  if (analyzer.kind === "keyword" && (raw.length !== (text.length ? 1 : 0) || text.length && raw[0] !== text)) throw new TypeError("Keyword tokenizer must preserve the complete input");
  return raw.map((token) => {
    if (typeof token !== "string") throw new TypeError("Analyzer tokens must be strings");
    const normalized = (analyzer.normalize ?? normalizeToken)(token);
    const term = analyzer.stem ? analyzer.stem(normalized) : normalized;
    if (typeof term !== "string" || !term || Array.from(term).length > maxLength) {
      throw new RangeError(`Analyzed tokens must contain 1\u2013${maxLength} code points`);
    }
    return term;
  });
}
const keywordAnalyzer = Object.freeze({
  id: "keyword-raw-v1",
  kind: "keyword",
  tokenize: (text) => text.length ? [text] : [],
  normalize: (text) => text
});
const foldedKeywordAnalyzer = Object.freeze({
  ...keywordAnalyzer,
  id: "keyword-lower-v1",
  normalize: (text) => text.toLowerCase()
});
const whitespaceAnalyzer = Object.freeze({
  id: "whitespace-raw-v1",
  tokenize: (text) => text.match(/\S+/gu) ?? [],
  normalize: (text) => text
});
const accentFoldedAnalyzer = Object.freeze({
  ...unicodeAnalyzer,
  id: "unicode-accent-folded-v1",
  normalize: (text) => text.normalize("NFKD").replace(new RegExp("\\p{M}", "gu"), "").toLowerCase()
});
const builtinAnalyzers = Object.freeze(Object.fromEntries(
  [unicodeAnalyzer, codeAnalyzer, keywordAnalyzer, foldedKeywordAnalyzer, whitespaceAnalyzer, accentFoldedAnalyzer].map((a) => [a.id, a])
));
const tokenizeJoined = (text) => tokenize(text.replace(/[­‌‍]/g, ""));
function segmentWords(locale) {
  const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
  return (text) => Array.from(segmenter.segment(text.normalize("NFKC"))).filter((segment) => segment.isWordLike).map((segment) => segment.segment);
}
function wordGrams(n, keepWord, script, words = tokenizeJoined) {
  return (text) => words(text).flatMap((word) => {
    const chars = Array.from(word);
    if (chars.length <= n || !script.test(word)) return [word];
    const grams = keepWord ? [word] : [];
    for (let i = 0; i + n <= chars.length; i++) grams.push(chars.slice(i, i + n).join(""));
    return grams;
  });
}

export { tokenize as a, analyze as b, createAnalyzer as c, builtinAnalyzers as d, codeAnalyzer as e, accentFoldedAnalyzer as f, foldedKeywordAnalyzer as g, whitespaceAnalyzer as h, keywordAnalyzer as k, normalizeToken as n, primaryLanguage as p, segmentWords as s, tokenizeJoined as t, unicodeAnalyzer as u, wordGrams as w };
