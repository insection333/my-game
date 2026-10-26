// Levels, XP and mastery: shared by every skill. The XP table is the one in GAME_DESIGN.md, derived
// by the paper model; verify fails if the two ever differ.
import type { Effect } from './effects.ts';

export const MAX_LEVEL = 40;

/** Extra XP while the fire burns, on average over an hour of play, in percent: the model's figure. */
export const FIRE_XP_PCT = 15;

/** The fire burns hotter the longer it is kept from going out (session 11): its extra XP climbs in
 *  three steps. Over a whole hour of play the steps average exactly FIRE_XP_PCT, so pacing holds. */
export const FIRE_HEAT: readonly { minutes: number; pct: number }[] = [
  { minutes: 0, pct: 8 },
  { minutes: 10, pct: 14 },
  { minutes: 20, pct: 17 },
];

/** The fire's step after burning `minutes` without going out: 1, 2 or 3. */
export const fireHeat = (minutes: number): number => FIRE_HEAT.filter((h) => minutes >= h.minutes).length;
/** The fire's extra XP after burning `minutes` without going out. */
export const fireXpPct = (minutes: number): number => FIRE_HEAT[fireHeat(minutes) - 1].pct;

/** Each tier's pace (GAME_DESIGN.md sections 5 and 6): seconds for a standard gathering action, and
 *  per ingredient in Smithing; and the XP an hour that pace pays before perks and mastery. */
export const TIER_LEVELS: readonly number[] = [1, 10, 20, 30];
/** The highest tier a level has reached: 1 at level 1, 2 from level 10, and so on. */
export const tierOf = (level: number): number => TIER_LEVELS.filter((l) => level >= l).length;
export const TIER_SECONDS: readonly number[] = [7.5, 12.5, 20, 26];
export const TIER_XP_PER_HOUR: readonly number[] = [5400, 7200, 9300, 12000];

/** XP_TABLE[level] is the total XP needed to reach that level; index 0 is unused. */
export const XP_TABLE: readonly number[] = [
  0, 0, 50, 150, 310, 520, 890, 1490, 2500, 4170, 6790, 10400, 15900, 23800, 34000, 46800, 62100, 79900, 101000, 126000,
  155000, 202000, 265000, 340000, 428000, 531000, 650000, 790000, 951000, 1140000, 1360000, 1650000, 2000000, 2430000,
  2920000, 3500000, 4170000, 4950000, 5850000, 6900000, 8100000,
];

export function levelFor(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= XP_TABLE[level + 1]) level++;
  return level;
}

/** Progress within the current level: XP into it, XP it spans, and XP still needed (0 at the top). */
export function levelProgress(xp: number): { level: number; into: number; span: number; toNext: number } {
  const level = levelFor(xp);
  if (level === MAX_LEVEL) return { level, into: 0, span: 0, toNext: 0 };
  const start = XP_TABLE[level];
  const span = XP_TABLE[level + 1] - start;
  return { level, into: xp - start, span, toNext: XP_TABLE[level + 1] - xp };
}

/** Completions needed for mastery steps 1 to 10. */
export const MASTERY_STEPS: readonly number[] = [30, 90, 210, 450, 900, 1800, 3600, 7200, 14400, 28800];
export const MASTERY_SPEED_PER_STEP = 3;
export const MASTERY_YIELD_PER_STEP = 6;

/** The mastery step from completions; masteryGain (a perk, in percent) makes each completion count for more. */
export function masteryStep(completions: number, masteryGainPct = 0): number {
  const effective = completions * (1 + masteryGainPct / 100);
  return MASTERY_STEPS.filter((c) => effective >= c).length;
}

/** What a mastery step gives an action: faster, and a chance of an extra item. */
export const masteryEffects = (step: number): Effect[] =>
  step === 0
    ? []
    : [
        { kind: 'speed', pct: MASTERY_SPEED_PER_STEP * step },
        { kind: 'extraYield', pct: MASTERY_YIELD_PER_STEP * step },
      ];
