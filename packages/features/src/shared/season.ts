// Seasons (session 164; the brief's long arc, item 4): every eight weeks a season opens, from the first on
// Monday 2 November 2026, with a twist that changes how it plays: one part of the game is lifted for its eight
// weeks, so the best choice changes as the seasons turn. The twists come round in turn. A season is reckoned
// from the clock alone (as the castle's weekly decree is), so it needs no job to start or end it; every
// lift is read where its kind is paid (complete.ts, spoils.ts, the expeditions' marks), so the pages, which
// count by the same functions, say it too. From the seventh season (4 October 2027, once each has come round), a season
// pairs two twists (session 221), the fifteen pairings in an order where no twist runs two seasons together,
// so the second year's seasons are new again and no pairing comes round for over two years.
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

/** The season that first pairs two twists, once each has come round alone (4 October 2027). */
export const PAIRED_FROM = 7;
/** The fifteen pairings of the six twists (by their place in TWISTS), in turn from PAIRED_FROM: no twist in
 *  two seasons running, and each about every third season. */
const PAIRS: readonly (readonly [number, number])[] = [
  [0, 1],
  [2, 5],
  [1, 3],
  [4, 5],
  [0, 3],
  [1, 5],
  [0, 4],
  [2, 3],
  [1, 4],
  [0, 2],
  [3, 4],
  [1, 2],
  [0, 5],
  [2, 4],
  [3, 5],
];

/** The twists of the season of this number: one for the first six, then two. */
export function twistsOf(number: number): Twist[] {
  if (number < PAIRED_FROM) return [TWISTS[(number - 1) % TWISTS.length]];
  const [a, b] = PAIRS[(number - PAIRED_FROM) % PAIRS.length];
  return [TWISTS[a], TWISTS[b]];
}

export interface Season {
  /** 1 for the first. */
  number: number;
  start: number;
  end: number;
  /** Its first twist (its only one before PAIRED_FROM). */
  twist: Twist;
  /** Its twists: one, or two from PAIRED_FROM. */
  twists: Twist[];
}

/** The season at a moment, or null before the first. */
export function seasonAt(now: number): Season | null {
  if (now < SEASON_EPOCH) return null;
  const i = Math.floor((now - SEASON_EPOCH) / SEASON_MS);
  const start = SEASON_EPOCH + i * SEASON_MS;
  const twists = twistsOf(i + 1);
  return { number: i + 1, start, end: start + SEASON_MS, twist: twists[0], twists };
}

const twistsAt = (at: number): Twist[] => seasonAt(at)?.twists ?? [];

/** The season's twist that lifts a skill's XP, if one does. */
export const seasonXpTwist = (skill: string, at: number): Twist | undefined =>
  twistsAt(at).find((x) => x.xp?.skills.includes(skill));

/** The season's lift to a skill's XP, in percent. */
export const seasonXpPct = (skill: string, at: number): number => seasonXpTwist(skill, at)?.xp?.pct ?? 0;

/** The season's lift to Rare and Legendary finds, in percent. */
export const seasonFindPct = (at: number): number => twistsAt(at).reduce((n, x) => n + (x.finds ?? 0), 0);

/** The season's lift to expeditions' marks, in percent. */
export const seasonMarksPct = (at: number): number => twistsAt(at).reduce((n, x) => n + (x.marks ?? 0), 0);

/** The season's lift to what a skill brings, in percent (a chance of an extra item). */
export const seasonYieldPct = (skill: string, at: number): number =>
  twistsAt(at).reduce((n, x) => n + (x.yield && x.yield.skills.includes(skill) ? x.yield.pct : 0), 0);
