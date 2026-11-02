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
    const part = freezeDeep(parsed.success ? parsed.data : (salvage?.(raw) ?? empty));
    read.set(raw, part);
    return part;
  };
}
