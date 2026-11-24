// The pedlar's part of the save (session 217): the day the lots were last handed in on, the lots handed in
// that day, and the favour earned (a lot handed in, one favour; a count, as deed points are, not a currency).
// Shared, so the deeds read the favour without importing the pedlar.
import type { State } from '@idle-clash/kernel';
import { z } from 'zod';
import { partReader } from './part.ts';

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const PedlarState = z
  .object({
    day: Day.nullable(),
    handed: z.array(z.enum(['find', 'material', 'dish'])).max(3),
    favour: z.number().int().nonnegative(),
  })
  .strict();
export type PedlarState = z.infer<typeof PedlarState>;
const EMPTY: PedlarState = { day: null, handed: [], favour: 0 };

export const pedlarOf: (state: State) => PedlarState = partReader('pedlar', PedlarState, EMPTY);
export const favourOf = (state: State): number => pedlarOf(state).favour;

export const dayOf = (at: number): string => new Date(at).toISOString().slice(0, 10);

/** The lots handed in today. */
export const handedToday = (state: State, at: number): ('find' | 'material' | 'dish')[] => {
  const p = pedlarOf(state);
  return p.day === dayOf(at) ? p.handed : [];
};
