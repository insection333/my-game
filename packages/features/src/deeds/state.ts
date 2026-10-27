// Deeds' part of the save: when each deed was done, and the honours chosen to show (a title beside
// your name, a banner's colour, a frame). Read on every draw, so each saved object is checked once.
import type { State } from '@idle-clash/kernel';
import { z } from 'zod';

const Key = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const time = z.number().int().nonnegative();

export const DeedsState = z
  .object({
    done: z.record(Key, time),
    title: Key.nullable().default(null),
    banner: Key.nullable().default(null),
    frame: Key.nullable().default(null),
  })
  .strict()
  .refine((d) => Object.keys(d.done).length <= 2000, 'too many deeds');
export type DeedsState = z.infer<typeof DeedsState>;

const EMPTY: DeedsState = Object.freeze({ done: Object.freeze({}), title: null, banner: null, frame: null });
const checked = new WeakMap<object, DeedsState>();

export function deedsOf(state: State): DeedsState {
  const raw = Object.hasOwn(state.features, 'deeds') ? state.features.deeds : undefined;
  if (!raw || typeof raw !== 'object') return EMPTY;
  const known = checked.get(raw);
  if (known) return known;
  const parsed = DeedsState.safeParse(raw);
  const d = parsed.success ? parsed.data : EMPTY;
  checked.set(raw, d);
  return d;
}

/** Deeds replaces its object whenever it writes, never changes it in place. */
export const setDeeds = (state: State, d: DeedsState): void => {
  state.features.deeds = d;
};
