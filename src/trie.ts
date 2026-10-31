interface Node { terminal: boolean; children: Map<string, Node> }
const node = (): Node => ({ terminal: false, children: new Map() });
/** `completion`: only a prefix of `term` lies within the radius, so the match is a typo in a word still being typed. */
export interface Neighbor { term: string; distance: number; completion: boolean }

/** Vocabulary trie. Levenshtein DP prunes prefixes, with no metric-tree assumptions. */
export class Vocabulary {
  private root: Node = node();
  private terms = new Set<string>();
  private reversed?: Vocabulary;
  private grams?: Map<string, Set<string>>;

  private trigrams(term: string): Set<string> {
    const chars = Array.from(term), result = new Set<string>();
    for (let i = 0; i + 2 < chars.length; i++) result.add(chars.slice(i, i + 3).join(''));
    return result;
  }
  private indexGrams(term: string): void {
    for (const gram of this.trigrams(term)) {
      let set = this.grams!.get(gram);
      if (!set) { set = new Set(); this.grams!.set(gram, set); }
      set.add(term);
    }
  }
  suffix(value: string): string[] {
    if (!this.reversed) {
      this.reversed = new Vocabulary();
      for (const term of this.terms) this.reversed.add(Array.from(term).reverse().join(''));
    }
    return this.reversed.prefix(Array.from(value).reverse().join('')).map(term => Array.from(term).reverse().join('')).sort();
  }
  substring(value: string): string[] {
    const grams = [...this.trigrams(value)];
    if (!grams.length) return [...this.terms].filter(term => term.includes(value)).sort();
    if (!this.grams) { this.grams = new Map(); for (const term of this.terms) this.indexGrams(term); }
    const sets = grams.map(gram => this.grams!.get(gram));
    if (sets.some(set => !set)) return [];
    sets.sort((a, b) => a!.size - b!.size);
    return [...sets[0]!].filter(term => sets.every(set => set!.has(term)) && term.includes(value)).sort();
  }

  add(term: string): void {
    if (this.terms.has(term)) return;
    this.terms.add(term);
    this.reversed?.add(Array.from(term).reverse().join(''));
    if (this.grams) this.indexGrams(term);
    let current = this.root;
    for (const char of term) {
      let next = current.children.get(char);
      if (!next) { next = node(); current.children.set(char, next); }
      current = next;
    }
    current.terminal = true;
  }

  delete(term: string): void {
    if (!this.terms.delete(term)) return;
    this.reversed?.delete(Array.from(term).reverse().join(''));
    if (this.grams) for (const gram of this.trigrams(term)) {
      const set = this.grams.get(gram)!; set.delete(term); if (!set.size) this.grams.delete(gram);
    }
    let current = this.root;
    const path: [Node, string][] = [];
    for (const char of term) {
      const next = current.children.get(char);
      if (!next) return;
      path.push([current, char]); current = next;
    }
    current.terminal = false;
    for (let i = path.length - 1; i >= 0 && !current.terminal && current.children.size === 0; i--) {
      const [parent, char] = path[i]; parent.children.delete(char); current = parent;
    }
  }

  prefix(prefix: string): string[] {
    let current = this.root;
    for (const char of prefix) {
      const next = current.children.get(char);
      if (!next) return [];
      current = next;
    }
    const result: string[] = [];
    const stack: [Node, string][] = [[current, prefix]];
    while (stack.length) {
      const [n, term] = stack.pop()!;
      if (n.terminal) result.push(term);
      for (const [char, child] of n.children) stack.push([child, term + char]);
    }
    return result.sort();
  }

  /**
   * Terms within `distance` edits of `query`; with `completion`, also terms that start with such a string, at the
   * distance of their closest prefix. Why carry the best prefix distance down the path instead of a second walk: each
   * DP row already holds the distance from the query to that node's prefix, so one walk answers both questions.
   * VERIFIED: test/oracles.test.mjs compares both modes with an exhaustive oracle, with and without transpositions.
   */
  fuzzy(query: string, distance: number, transpositions = false, completion = false): Neighbor[] {
    const chars = Array.from(query);
    const initial = Array.from({ length: chars.length + 1 }, (_, i) => i);
    const stack: [Node, string, number[], number[] | undefined, string, number][] = [[this.root, '', initial, undefined, '', completion ? chars.length : Infinity]];
    const result: Neighbor[] = [];
    while (stack.length) {
      const [n, prefix, previous, beforePrevious, previousChar, best] = stack.pop()!;
      for (const [char, child] of n.children) {
        const row = [previous[0] + 1];
        let minimum = row[0];
        for (let i = 1; i <= chars.length; i++) {
          row[i] = Math.min(row[i - 1] + 1, previous[i] + 1, previous[i - 1] + (chars[i - 1] === char ? 0 : 1));
          if (transpositions && beforePrevious && i > 1 && char === chars[i - 2] && previousChar === chars[i - 1]) {
            row[i] = Math.min(row[i], beforePrevious[i - 2] + 1);
          }
          minimum = Math.min(minimum, row[i]);
        }
        const term = prefix + char, whole = row[chars.length], closest = completion ? Math.min(best, whole) : whole;
        if (child.terminal && closest <= distance) result.push({ term, distance: closest, completion: whole > closest });
        // Once a prefix is within the radius, every term below it matches, however far its full row drifts.
        if (minimum <= distance || closest <= distance) stack.push([child, term, row, previous, char, closest]);
      }
    }
    return result.sort((a, b) => a.distance - b.distance || compareString(a.term, b.term));
  }
}

/** Locale-independent order for reproducible ranking on browser and server. */
export const compareString = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
