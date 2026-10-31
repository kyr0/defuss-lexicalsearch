/** Positive Robertson IDF; df counts distinct documents in this field. */
export function bm25(tf: number, df: number, n: number, length: number, average: number, k1: number, b: number): number {
  if (tf === 0 || n === 0 || average === 0) return 0;
  const idf = Math.log1p((n - df + 0.5) / (df + 0.5));
  return idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * length / average));
}

/** Hoist corpus/term constants out of posting traversal. */
export function bm25Scorer(df: number, n: number, average: number, k1: number, b: number, weight: number): (tf: number, length: number) => number {
  if (!n || !average) return () => 0;
  const scale = weight * Math.log1p((n - df + .5) / (df + .5)) * (k1 + 1);
  const constant = k1 * (1 - b), lengthScale = k1 * b / average;
  return (tf, length) => tf ? scale * tf / (tf + constant + lengthScale * length) : 0;
}
