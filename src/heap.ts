/** Bounded top-k selection. compare(a,b)<0 means a ranks before b. */
export class TopK<T> {
  private items: T[] = [];
  constructor(private capacity: number, private compare: (a: T, b: T) => number) {}
  add(item: T): void {
    if (this.capacity === 0) return;
    if (this.items.length < this.capacity) {
      let i = this.items.push(item) - 1;
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (this.compare(this.items[i], this.items[parent]) <= 0) break;
        [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]]; i = parent;
      }
    } else if (this.compare(item, this.items[0]) < 0) {
      this.items[0] = item;
      let i = 0;
      while (2 * i + 1 < this.items.length) {
        let worse = 2 * i + 1;
        if (worse + 1 < this.items.length && this.compare(this.items[worse + 1], this.items[worse]) > 0) worse++;
        if (this.compare(this.items[worse], this.items[i]) <= 0) break;
        [this.items[i], this.items[worse]] = [this.items[worse], this.items[i]]; i = worse;
      }
    }
  }
  sorted(): T[] { return this.items.sort(this.compare); }
}
