// Levels, XP and mastery: shared by every skill. The XP table is the one in GAME_DESIGN.md, derived
// by the paper model; verify fails if the two ever differ.
import type { Effect } from './effects.ts';

/** The top level: version 1 stopped at 40; the expansion's climb goes to 99 (docs/EXPANSION.md). */
export const MAX_LEVEL = 99;

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
 *  per ingredient in Smithing; and the XP an hour that pace pays before perks and mastery. Tiers 5 to 8
 *  (the Sunken Fen's and the Ashen Peaks') open further apart. */
export const TIER_LEVELS: readonly number[] = [1, 10, 20, 30, 40, 55, 70, 85];
/** The highest tier a level has reached: 1 at level 1, 2 from level 10, and so on. */
export const tierOf = (level: number): number => TIER_LEVELS.filter((l) => level >= l).length;
export const TIER_SECONDS: readonly number[] = [7.5, 12.5, 20, 26, 30, 34, 38, 42];
export const TIER_XP_PER_HOUR: readonly number[] = [5400, 7200, 9300, 12000, 17000, 22000, 28000, 35000];

/** XP_TABLE[level] is the total XP needed to reach that level; index 0 is unused. */
export const XP_TABLE: readonly number[] = [
  0, 0, 50, 150, 310, 520, 890, 1490, 2500, 4170, 6790, 10400, 15900, 23800, 34000, 46800, 62100, 79900, 101000, 126000,
  155000, 202000, 265000, 340000, 428000, 531000, 650000, 790000, 951000, 1140000, 1360000, 1650000, 2000000, 2430000,
  2920000, 3500000, 4170000, 4950000, 5850000, 6900000, 8100000, 9302000, 10507000, 11714000, 12924000, 14136000,
  15350000, 16567000, 17786000, 19008000, 20232000, 21459000, 22688000, 23920000, 25154000, 26391000, 27630000,
  28871000, 30115000, 31361000, 32610000, 33861000, 35115000, 36371000, 37630000, 38891000, 40155000, 41422000,
  42691000, 43963000, 45237000, 46514000, 47793000, 49075000, 50359000, 51646000, 52935000, 54227000, 55522000,
  56819000, 58119000, 59421000, 60726000, 62034000, 63344000, 64657000, 65973000, 67291000, 68612000, 69935000,
  71261000, 72590000, 73921000, 75255000, 76592000, 77931000, 79273000, 80618000, 81965000, 83315000,
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
