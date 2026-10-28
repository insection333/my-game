// Expeditions' part of the save: the marks held and the relics' ranks; how many routes have been
// drawn (each preview draws from this count); the run under way, if any, with its route and how far it
// has come; the day each boss was last fought in the lane; and what has been done (runs by length,
// boss wins, twists met), for deeds. Read on every draw, so each saved object is checked once.
import type { State } from '@idle-clash/kernel';
import { z } from 'zod';

const Key = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const Count = z.number().int().nonnegative();
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
/** The most finds a run's record keeps (each once). */
export const RUN_FINDS = 50;

export const Stage = z.object({ foe: Key, after: z.enum(['cache', 'camp']).nullable() }).strict();
export type Stage = z.infer<typeof Stage>;

/** A route as drawn: a foe for each fight stage, the twists, the fork's two roads and where it is. */
export const Route = z
  .object({
    region: z.enum(['march', 'fen', 'peaks']),
    hours: z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(8)]),
    stages: z.array(Stage).min(1).max(48),
    twists: z.array(Key).min(1).max(2),
    roads: z.tuple([Key, Key]),
    fork: Count,
  })
  .strict();
export type Route = z.infer<typeof Route>;

/** A run: its route, the road taken, the next stage, and what it has brought so far (for its story). */
export const Run = Route.extend({
  /** Which route this is: how many had been drawn before it (its cache draws come from this). */
  seq: Count,
  road: Key,
  at: Count,
  marks: Count,
  cleared: Count,
  finds: z.array(Key).max(RUN_FINDS),
}).strict();
export type Run = z.infer<typeof Run>;

export const ExpeditionState = z
  .object({
    marks: Count,
    relics: z.record(Key, z.number().int().min(1).max(5)),
    drawn: Count,
    run: Run.nullable(),
    bossDay: z.record(Key, Day),
    wins: z.record(Key, Count),
    runs: z.record(z.string().regex(/^[1248]$/), Count),
    twists: z.array(Key).max(20),
  })
  .strict();
export type ExpeditionState = z.infer<typeof ExpeditionState>;

const EMPTY: ExpeditionState = Object.freeze({
  marks: 0,
  relics: Object.freeze({}),
  drawn: 0,
  run: null,
  bossDay: Object.freeze({}),
  wins: Object.freeze({}),
  runs: Object.freeze({}),
  twists: Object.freeze([]) as unknown as string[],
});
const checked = new WeakMap<object, ExpeditionState>();

export function expeditionsOf(state: State): ExpeditionState {
  const raw = Object.hasOwn(state.features, 'expeditions') ? state.features.expeditions : undefined;
  if (!raw || typeof raw !== 'object') return EMPTY;
  const known = checked.get(raw);
  if (known) return known;
  const parsed = ExpeditionState.safeParse(raw);
  // A run's record that does not read costs that run, never the marks, relics and wins beside it.
  const salvaged = parsed.success ? null : ExpeditionState.safeParse({ ...raw, run: null });
  const e = parsed.success ? parsed.data : salvaged?.success ? salvaged.data : EMPTY;
  checked.set(raw, e);
  return e;
}

/** Expeditions replaces its object whenever it writes, never changes it in place. */
export const setExpeditions = (state: State, e: ExpeditionState): void => {
  state.features.expeditions = e;
};
