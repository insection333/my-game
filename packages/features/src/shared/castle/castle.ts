// Castle Clash: a castle as the engine reads it (one `player_bastions` row, its JSON parsed), and the
// UTC calendar the plan's lazy sync counts in. Pure: no clock, no database; the server maps rows.
import { AP, SIEGE, type BuildingId, type TechId, type UnitId } from '@idle-clash/content';

export type Shares = readonly [number, number, number];
export type DebuffKind = 'poison' | 'sabotage' | 'forge';

/** A debuff on a castle, from a successful spy mission: stacks, and when it lapses. */
export interface Debuff {
  kind: DebuffKind;
  stacks: number;
  until: number;
}

/** One attacker's dealings with one defender, kept on the attacker's row: the times of sieges and spy
 *  missions in the last 24 hours, and the compromised network's stacks and when they lapse. */
export interface PairEntry {
  d: string;
  sieges: number[];
  spies: number[];
  cn: number;
  cnUntil: number;
}

export interface Castle {
  userId: string;
  createdAt: number;
  updatedAt: number;
  activeAp: number;
  lastApSyncAt: number;
  lastCtaDateUtc: string | null;
  streakAtLastCta: number;
  treasury: number;
  edict: string | null;
  lastUpkeepAt: number;
  payFromTreasury: boolean;
  levels: Record<BuildingId | UnitId, number>;
  drillXp: Record<UnitId, number>;
  techs: Record<TechId, number>;
  /** Formations in whole percents, vanguard, outriders, siege; each sums to 100. */
  offense: Shares;
  defense: Shares;
  activeTrap: string | null;
  castellan: string | null;
  defenseChangedAt: number | null;
  reconLockdownUntil: number | null;
  withdrawLockdownUntil: number | null;
  shieldUntil: number;
  /** Percent, 50 to 100. */
  wallIntegrity: number;
  /** Percent wounded, 0 to 30. */
  infirmaryPct: number;
  recoverySyncedAt: number;
  genuineReceived: number[];
  siegesDayUtc: string | null;
  siegesToday: number;
  rating: number;
  warMarks: number;
  warMarksEarned: number;
  excavationDepth: number;
  incursionTier: number;
  incursionScoutedTier: number;
  /** Owned war relics by id, each at level 1 to 5. */
  relics: Record<string, number>;
  equippedRelics: string[];
  debuffs: Debuff[];
  /** Immunity to each debuff kind, until when. */
  immunities: Partial<Record<DebuffKind, number>>;
  pairs: PairEntry[];
}

const DAY = 86_400_000;

/** `YYYY-MM-DD` of a moment, in UTC. */
export const formatUtcDate = (t: number): string => new Date(t).toISOString().slice(0, 10);
export const startOfUtcDay = (t: number): number => Math.floor(t / DAY) * DAY;
/** The first moment after a UTC date: 00:00:00 of the next day. */
export const endOfUtcDay = (date: string): number => Date.parse(`${date}T00:00:00Z`) + DAY;
/** Whole days from one date to another (`2026-11-01` to `2026-11-03` is 2). */
export const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);

/** A castle as it is first opened: every level 1, an even formation, 60 AP and the novice shield. */
export function newCastle(userId: string, now: number): Castle {
  return {
    userId,
    createdAt: now,
    updatedAt: now,
    activeAp: AP.START_AP,
    lastApSyncAt: now,
    lastCtaDateUtc: null,
    streakAtLastCta: 0,
    treasury: 0,
    edict: null,
    lastUpkeepAt: now,
    payFromTreasury: false,
    levels: { walls: 1, deepVault: 1, watchtower: 1, spyGuild: 1, vanguard: 1, outriders: 1, siege: 1 },
    drillXp: { vanguard: 0, outriders: 0, siege: 0 },
    techs: { logistics: 0, siegecraft: 0, fortification: 0, espionage: 0 },
    offense: [34, 33, 33],
    defense: [34, 33, 33],
    activeTrap: null,
    castellan: null,
    defenseChangedAt: null,
    reconLockdownUntil: null,
    withdrawLockdownUntil: null,
    shieldUntil: now + SIEGE.NOVICE_MS,
    wallIntegrity: 100,
    infirmaryPct: 0,
    recoverySyncedAt: now,
    genuineReceived: [],
    siegesDayUtc: null,
    siegesToday: 0,
    rating: 0,
    warMarks: 0,
    warMarksEarned: 0,
    excavationDepth: 0,
    incursionTier: 1,
    incursionScoutedTier: 0,
    relics: {},
    equippedRelics: [],
    debuffs: [],
    immunities: {},
    pairs: [],
  };
}

/** Whole-percent shares as fractions summing to 1. */
export const fractions = (s: Shares): [number, number, number] => {
  const total = s[0] + s[1] + s[2];
  return total > 0 ? [s[0] / total, s[1] / total, s[2] / total] : [1 / 3, 1 / 3, 1 / 3];
};

/** A formation is three whole percents from 0 to 100 summing to exactly 100. */
export const validShares = (s: readonly number[]): boolean =>
  s.length === 3 && s.every((x) => Number.isInteger(x) && x >= 0 && x <= 100) && s[0] + s[1] + s[2] === 100;

export const isShielded = (c: Castle, now: number): boolean => c.shieldUntil > now;
