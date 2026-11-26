// A feature's part of a save, read once per object (session 37). Parts are read many times in one
// advance (every fight reads the steading, every repetition the storehouse), and checking each against its
// schema every time was most of an offline catch-up's work. Every feature replaces its part whenever it
// writes and never changes it in place, so what one object read as stays true; what it read as is frozen,
// so a reader that tried to change it would fail in the tests rather than change the next reader's copy.
import type { State } from '@idle-clash/kernel';
import type { z } from 'zod';

function freezeDeep<T>(v: T): T {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) freezeDeep(x);
  }
  return v;
}

/** A reader of one feature's part: the part as its schema reads it, or `empty` when it is missing or
 *  does not read (`salvage` may offer a second reading first). */
export function partReader<T>(
  id: string,
  schema: z.ZodType<T>,
  empty: T,
  salvage?: (raw: object) => T | null,
): (state: State) => T {
  const read = new WeakMap<object, T>();
  freezeDeep(empty);
  return (state) => {
    const raw = Object.hasOwn(state.features, id) ? state.features[id] : undefined;
    if (!raw || typeof raw !== 'object') return empty;
    const known = read.get(raw);
    if (known) return known;
    const parsed = schema.safeParse(raw);
    let part: T;
    if (parsed.success) part = parsed.data;
    else {
      // Keys a later build added, let go before anything is salvaged (session 272: after a rollback, the older
      // build read a part a newer one had written as empty, and its next write put months of play in its place).
      const kept = withoutUnknown(schema, raw);
      part = kept ?? salvage?.(stripped(schema, raw)) ?? empty;
    }
    freezeDeep(part);
    read.set(raw, part);
    return part;
  };
}

type Issue = { code: string; path: PropertyKey[]; keys?: string[] };

/** The part with every key its schema does not know taken out, wherever it is nested. */
export function stripped(schema: z.ZodType<unknown>, raw: object): object {
  const v: unknown = structuredClone(raw);
  for (let round = 0; round < 32; round++) {
    const r = schema.safeParse(v);
    if (r.success) break;
    const unknown = (r.error.issues as Issue[]).filter((i) => i.code === 'unrecognized_keys');
    if (!unknown.length) break;
    for (const issue of unknown) {
      let at: unknown = v;
      for (const step of issue.path)
        at = at && typeof at === 'object' ? (at as Record<PropertyKey, unknown>)[step] : undefined;
      if (at && typeof at === 'object') for (const k of issue.keys ?? []) delete (at as Record<string, unknown>)[k];
    }
  }
  return v as object;
}

/** The part as its schema reads it once unknown keys are let go, or null if it still does not read. */
export function withoutUnknown<T>(schema: z.ZodType<T>, raw: object): T | null {
  const r = schema.safeParse(stripped(schema, raw));
  return r.success ? r.data : null;
}

/** A part's salvage that lets go of what is least worth keeping (session 263: a list of locks or gifts opened that
 *  did not read cost the whole part, the Storehouse's enlargements or the goals with it). */
export function dropping<T>(schema: z.ZodType<T>, ...keys: string[]): (raw: object) => T | null {
  return (raw) => {
    const kept = Object.fromEntries(Object.entries(raw).filter(([k]) => !keys.includes(k)));
    const r = schema.safeParse(kept);
    return r.success ? r.data : null;
  };
}
