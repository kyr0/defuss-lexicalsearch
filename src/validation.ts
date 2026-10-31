import type { JsonValue } from './types';

export function integer(value: unknown, name: string, min: number, max = Number.MAX_SAFE_INTEGER): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer in [${min}, ${max}]`);
  }
}

export function record(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function id(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value) throw new TypeError('Document id must be a nonempty string');
}

/** Validate lossless JSON metadata; freeze the owned copy against callback mutation. */
export function ownJson<T extends JsonValue>(value: T): T {
  const active = new Set<object>();
  const visit = (v: unknown, depth: number): void => {
    if (depth > 100) throw new RangeError('Metadata nesting exceeds 100');
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return;
    if (typeof v === 'number' && Number.isFinite(v)) return;
    if (!Array.isArray(v) && !record(v)) throw new TypeError('Metadata must be losslessly JSON-serializable');
    if (active.has(v)) throw new TypeError('Metadata must not be cyclic');
    active.add(v);
    if (Array.isArray(v)) {
      if (Reflect.ownKeys(v).length !== v.length + 1) throw new TypeError('Metadata arrays must be dense and have no extra properties');
      for (let i = 0; i < v.length; i++) {
        const descriptor = Object.getOwnPropertyDescriptor(v, String(i));
        if (!descriptor || descriptor.get) throw new TypeError('Metadata array accessors/holes are not supported');
        visit(v[i], depth + 1);
      }
    } else {
      for (const key of Reflect.ownKeys(v)) {
        if (typeof key !== 'string' || !Object.getOwnPropertyDescriptor(v, key)?.enumerable) throw new TypeError('Metadata keys must be enumerable strings');
        if (Object.getOwnPropertyDescriptor(v, key)?.get) throw new TypeError('Metadata getters are not supported');
        visit(v[key], depth + 1);
      }
    }
    active.delete(v);
  };
  visit(value, 0);
  const copy = JSON.parse(JSON.stringify(value)) as T;
  const freeze = (v: JsonValue): void => {
    if (v !== null && typeof v === 'object') { Object.values(v).forEach(freeze); Object.freeze(v); }
  };
  freeze(copy);
  return copy;
}
