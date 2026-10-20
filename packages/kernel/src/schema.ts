// The save document, version 1. Strict: a document that fails this schema is mended (mend.ts)
// before the engine ever sees it.
import { z } from 'zod';

export const SAVE_VERSION = 2;

export const LANE_IDS = ['gathering', 'gathering2', 'artisan', 'combat'] as const;
export type LaneId = (typeof LANE_IDS)[number];
/** The kind of work an action does; gathering2 (opened by the fire) takes gathering actions. */
export type LaneKind = 'gathering' | 'artisan' | 'combat';
export const laneKind = (lane: LaneId): LaneKind => (lane === 'gathering2' ? 'gathering' : lane);

const time = z.number().int().nonnegative();
const count = z.number().int().nonnegative();
const name = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/);

export const ActionRef = z.object({ feature: name, id: name }).strict();
export type ActionRef = z.infer<typeof ActionRef>;
export const actionKey = (a: ActionRef) => `${a.feature}:${a.id}`;

/** Codes and event names are camelCase identifiers, like `outOfInputs`. */
const code = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-zA-Z0-9]*$/);

export const StopReason = z
  .object({
    code,
    detail: z.record(z.string(), z.union([z.string().max(200), z.number()])).optional(),
  })
  .strict();
export type StopReason = z.infer<typeof StopReason>;

export const Running = z
  .object({ action: ActionRef, startedAt: time, endsAt: time })
  .strict()
  .refine((r) => r.endsAt > r.startedAt, 'an action must end after it starts');
export type Running = z.infer<typeof Running>;

export const Lane = z
  .object({
    current: Running.nullable(),
    next: ActionRef.nullable(),
    stopped: z.object({ reason: StopReason, at: time }).strict().nullable(),
    /** How many random numbers this lane has drawn: its counter in the rng. */
    rolls: count,
  })
  .strict();
export type Lane = z.infer<typeof Lane>;

/**
 * Luck for Uncommon finds, shared by every lane: misses since the last find raise the next chance,
 * and a long stretch of active play with no notable moment makes the next find certain.
 */
export const Luck = z.object({ misses: count, lastMoment: time }).strict();
export type Luck = z.infer<typeof Luck>;

export const SkillXp = z.object({ xp: count, part: z.number().int().min(1).max(999).optional() }).strict();
export type SkillXp = z.infer<typeof SkillXp>;

export const State = z
  .object({
    seed: z.number().int().min(0).max(0xffffffff),
    /** The time the state has been advanced to. */
    clock: time,
    /** The last real input; lanes run until lastSeen plus the away cap. */
    lastSeen: time,
    /** The fire burns while the clock is before this. */
    fireUntil: time,
    lanes: z.object(Object.fromEntries(LANE_IDS.map((l) => [l, Lane])) as Record<LaneId, typeof Lane>).strict(),
    items: z.record(name, count),
    /** XP by skill. `part` carries thousandths of an XP, so bonuses like +15% are exact over time. */
    skills: z.record(name, SkillXp),
    /** Completions of each action ("feature:id"); mastery steps are derived from these. */
    mastery: z.record(z.string().max(129), count),
    luck: Luck,
    /** When each find was first found: the collection log. */
    found: z.record(name, time),
    /** Each feature's own state, checked by that feature's schema (session 3). */
    features: z.record(name, z.unknown()),
  })
  .strict()
  .refine((s) => s.lastSeen <= s.clock, 'the last input cannot be later than the clock');
export type State = z.infer<typeof State>;

export const RequestRecord = z.object({ id: z.string().min(1).max(64), at: time, result: z.unknown() }).strict();
export type RequestRecord = z.infer<typeof RequestRecord>;
/** How many recent request ids a save remembers, so a retry or double click does nothing twice. */
export const REMEMBERED_REQUESTS = 50;

export const SaveDoc = z
  .object({
    version: z.literal(SAVE_VERSION),
    state: State,
    requests: z.array(RequestRecord).max(REMEMBERED_REQUESTS),
  })
  .strict();
export type SaveDoc = z.infer<typeof SaveDoc>;
