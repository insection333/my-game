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
    /** The boss at its end, drawn from the region's two (session 210). Runs from before met the region's last. */
    boss: Key.optional(),
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

/** The last run home (session 74), as its homecoming said it: kept so the tab can tell it until the next
 *  run sets out, since a run may come home while the player is elsewhere. */
export const Last = z
  .object({
    at: Count,
    region: z.enum(['march', 'fen', 'peaks']),
    hours: z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(8)]),
    road: Key,
    boss: Key,
    outcome: z.enum(['won', 'lost', 'retreated']),
    cleared: Count,
    stages: Count,
    marks: Count,
    finds: z.array(Key).max(RUN_FINDS),
  })
  .strict();
export type Last = z.infer<typeof Last>;

export const ExpeditionState = z
  .object({
    marks: Count,
    relics: z.record(Key, z.number().int().min(1).max(5)),
    drawn: Count,
    run: Run.nullable(),
    bossDay: z.record(Key, Day),
    /** The fights each boss has banked after the day it was last fought (session 253). Saves from before
     *  have none. */
    bossLeft: z.record(Key, z.number().int().min(0).max(2)).optional(),
    wins: z.record(Key, Count),
    runs: z.record(z.string().regex(/^[1248]$/), Count),
    twists: z.array(Key).max(20),
    /** Saves from before session 74 have none. */
    last: Last.nullable().optional(),
    /** The realm's boss (session 174): the day it was last fought, the week whose share was last taken, and
     *  the weeks it fell with this player's strike. Saves from before have none. */
    realm: z
      .object({
        day: Day.nullable(),
        claimed: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable(),
        fallen: Count,
        /** The strikes banked after the day it was last fought (session 253). */
        left: z.number().int().min(0).max(2).optional(),
      })
      .strict()
      .optional(),
    /** Whether a run that comes home with its boss beaten sets out again on a new route of the same length into
     *  the same region (session 239: a run's lane stood idle for the rest of a day away). Unset is on. */
    again: z.boolean().optional(),
    /** The day's bosses (session 239): the fights one press set for the day, the realm's boss as `realm`, fought
     *  in this order in the Combat lane as `expeditions:bosses`, each once. */
    round: z
      .object({ day: Day, foes: z.array(Key).max(24) })
      .strict()
      .optional(),
    /** The Deep (session 212): the deepest depth reached ever and this week, the week it counts for, the
     *  descents made, and the descent under way. Saves from before have none. */
    deep: z
      .object({
        deepest: Count,
        week: Day.nullable(),
        weekDeepest: Count,
        descents: Count,
        /** `was`: the deepest ever as the descent began, so its end says whether it went past it; `fed`: the
         *  meals eaten from the descent's pack. */
        run: z
          .object({ depth: Count, from: Count, was: Count, marks: Count, seq: Count, fed: Count })
          .strict()
          .nullable(),
        /** The Deep's relics (session 215) by rank. Saves from before have none. */
        relics: z.record(Key, z.number().int().min(1).max(500)).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type ExpeditionState = z.infer<typeof ExpeditionState>;
export type DeepState = NonNullable<ExpeditionState['deep']>;
export const DEEP_EMPTY: DeepState = { deepest: 0, week: null, weekDeepest: 0, descents: 0, run: null };

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

/** What can be let go of a part that does not read, the least first: the run, then the day's list of bosses,
 *  then the fights banked (each day's back by tomorrow). */
function salvage(raw: Record<string, unknown>): ExpeditionState | null {
  const realm = raw.realm && typeof raw.realm === 'object' ? { ...raw.realm, left: undefined } : raw.realm;
  for (const tried of [
    { ...raw, run: null },
    { ...raw, run: null, round: undefined },
    { ...raw, run: null, round: undefined, bossLeft: undefined, realm },
  ]) {
    const r = ExpeditionState.safeParse(tried);
    if (r.success) return r.data;
  }
  return null;
}

export function expeditionsOf(state: State): ExpeditionState {
  const raw = Object.hasOwn(state.features, 'expeditions') ? state.features.expeditions : undefined;
  if (!raw || typeof raw !== 'object') return EMPTY;
  const known = checked.get(raw);
  if (known) return known;
  const parsed = ExpeditionState.safeParse(raw);
  // A run's record that does not read costs that run, never the marks, relics and wins beside it; nor does the
  // day's list of bosses or the fights banked (session 263: either unread cost the whole part, marks and all).
  const salvaged = parsed.success ? null : salvage(raw as Record<string, unknown>);
  const e = parsed.success ? parsed.data : (salvaged ?? EMPTY);
  checked.set(raw, e);
  return e;
}

/** Expeditions replaces its object whenever it writes, never changes it in place. */
export const setExpeditions = (state: State, e: ExpeditionState): void => {
  state.features.expeditions = e;
};
