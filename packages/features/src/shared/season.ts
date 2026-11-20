// Seasons (session 164; the brief's long arc, item 4): every eight weeks a season opens, from the first on
// Monday 2 November 2026, with a twist that changes how it plays: one part of the game is lifted for its eight
// weeks, so the best choice changes as the seasons turn. The twists come round in turn. A season is reckoned
// from the clock alone (as the castle's weekly decree is), so it needs no job to start or end it; every
// lift is read where its kind is paid (complete.ts, spoils.ts, the expeditions' marks), so the pages, which
// count by the same functions, say it too.
import { HITPOINTS, STYLE_SKILLS } from './combat/data.ts';

export const SEASON_EPOCH = Date.UTC(2026, 10, 2);
export const SEASON_DAYS = 56;
const SEASON_MS = SEASON_DAYS * 86_400_000;

const GATHERING = ['woodcutting', 'mining', 'fishing', 'runecraft'];
const ARTISAN = ['smithing', 'cooking', 'fletching'];
const FIGHTING = [...STYLE_SKILLS, HITPOINTS];

/** A season's twist: what it lifts, each in percent. */
export interface Twist {
  id: string;
  /** XP in these skills. */
  xp?: { skills: readonly string[]; pct: number };
  /** Rare and Legendary finds, everywhere. */
  finds?: number;
  /** Expeditions' marks. */
  marks?: number;
  /** More of what these skills bring (as the Woodyard's chance of an extra item). */
  yield?: { skills: readonly string[]; pct: number };
}

export const TWISTS: readonly Twist[] = [
  { id: 'greenwood', xp: { skills: GATHERING, pct: 20 } },
  { id: 'forgefire', xp: { skills: ARTISAN, pct: 20 } },
  { id: 'muster', xp: { skills: FIGHTING, pct: 20 } },
  { id: 'omens', finds: 30 },
  { id: 'road', marks: 25 },
  { id: 'plenty', yield: { skills: GATHERING, pct: 10 } },
];

export interface Season {
  /** 1 for the first. */
  number: number;
  start: number;
  end: number;
  twist: Twist;
}

/** The season at a moment, or null before the first. */
export function seasonAt(now: number): Season | null {
  if (now < SEASON_EPOCH) return null;
  const i = Math.floor((now - SEASON_EPOCH) / SEASON_MS);
  const start = SEASON_EPOCH + i * SEASON_MS;
  return { number: i + 1, start, end: start + SEASON_MS, twist: TWISTS[i % TWISTS.length] };
}

/** The season's lift to a skill's XP, in percent. */
export const seasonXpPct = (skill: string, at: number): number => {
  const xp = seasonAt(at)?.twist.xp;
  return xp && xp.skills.includes(skill) ? xp.pct : 0;
};

/** The season's lift to Rare and Legendary finds, in percent. */
export const seasonFindPct = (at: number): number => seasonAt(at)?.twist.finds ?? 0;

/** The season's lift to expeditions' marks, in percent. */
export const seasonMarksPct = (at: number): number => seasonAt(at)?.twist.marks ?? 0;

/** The season's lift to what a skill brings, in percent (a chance of an extra item). */
export const seasonYieldPct = (skill: string, at: number): number => {
  const y = seasonAt(at)?.twist.yield;
  return y && y.skills.includes(skill) ? y.pct : 0;
};
