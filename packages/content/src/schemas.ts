// Shared content schemas: ids, items and the unlock ladder every skill has.
import { z } from 'zod';
import { Effect } from './effects.ts';
import { MAX_LEVEL } from './progression.ts';

export const Id = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'ids are lower case letters, digits and hyphens');

export const STYLES = ['melee', 'archery', 'magic'] as const;
export type Style = (typeof STYLES)[number];
export const GEAR_SLOTS = ['weapon', 'helm', 'body', 'legs'] as const;
export type GearSlot = (typeof GEAR_SLOTS)[number];

/** What a piece of gear is: where it is worn, its tier, and for a weapon the style it fights with. */
export const Gear = z
  .object({
    slot: z.enum(GEAR_SLOTS),
    tier: z.number().int().min(1).max(8),
    style: z.enum(STYLES).optional(),
  })
  .strict()
  .refine((g) => (g.slot === 'weapon') === (g.style !== undefined), 'a weapon, and only a weapon, has a style');
export type Gear = z.infer<typeof Gear>;

export const Item = z
  .object({
    id: Id,
    kind: z.enum(['resource', 'gear', 'food', 'find']),
    /** What the vendor pays for one. */
    value: z.number().int().nonnegative(),
    /** Gear only: where it is worn and how good it is. */
    gear: Gear.optional(),
    /** Food only: health one restores (on the ×10 scale). */
    heals: z.number().int().positive().optional(),
  })
  .strict()
  .refine((i) => (i.kind === 'gear') === (i.gear !== undefined), 'gear, and only gear, says how it is worn')
  .refine((i) => (i.kind === 'food') === (i.heals !== undefined), 'food, and only food, says how much it heals');
export type Item = z.infer<typeof Item>;

export const Level = z.number().int().min(1).max(MAX_LEVEL);

export const Unlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('action'), action: Id }).strict(),
  /** A tier of gear: a style wields its weapon of the tier, Hitpoints wears its armour. */
  z
    .object({
      type: z.literal('tier'),
      tier: z.number().int().min(1).max(8),
      use: z.enum(['wield', 'wear']),
      style: z.enum(STYLES).optional(),
    })
    .strict(),
  /** A foe that can now be fought (Hitpoints opens foes; its id is the combat action's). */
  z.object({ type: z.literal('foe'), foe: Id }).strict(),
  /** A food the vendor now sells. */
  z.object({ type: z.literal('food'), item: Id }).strict(),
  z
    .object({ type: z.literal('perk'), perk: Id, rank: z.number().int().min(1).max(MAX_LEVEL), effect: Effect })
    .strict(),
]);
export type Unlock = z.infer<typeof Unlock>;

/** A skill's unlocks by level: index 0 is level 1. Every level must unlock something. */
export const Ladder = z.array(z.array(Unlock)).length(MAX_LEVEL);
export type Ladder = z.infer<typeof Ladder>;

/** A perk that returns at several levels, a rank higher each time. */
export interface PerkLine {
  perk: string;
  effect: Effect;
  levels: number[];
}

/** Builds a ladder from the levels actions open at and the levels each perk line returns at. */
export function buildLadder(actions: { id: string; level: number }[], perks: PerkLine[]): Ladder {
  const ladder: Unlock[][] = Array.from({ length: MAX_LEVEL }, () => []);
  for (const a of actions) ladder[a.level - 1].push({ type: 'action', action: a.id });
  for (const line of perks) {
    line.levels.forEach((level, i) =>
      ladder[level - 1].push({ type: 'perk', perk: line.perk, rank: i + 1, effect: line.effect }),
    );
  }
  return ladder;
}

/** From this level (the expansion's climb past 40) a perk line's ranks give half: there are many more. */
export const LATE_PERK_FROM = 41;
const halfOf = (e: Effect): Effect => ('pct' in e ? { ...e, pct: e.pct / 2 } : { ...e, amount: e.amount / 2 });

/** Fills every level from 2 to the top that unlocks nothing yet with the next perk line's next rank, in
 *  turn (GAME_DESIGN.md section 12); the capstones (at 40 and the top) are fixed. Changes `ladder`. */
export function fillPerks(
  ladder: Unlock[][],
  lines: readonly { perk: string; effect: Effect }[],
  capstones: Record<number, { perk: string; effect: Effect }>,
): Ladder {
  const ranks = lines.map(() => 0);
  let next = 0;
  for (let level = 2; level <= MAX_LEVEL; level++) {
    const cap = capstones[level];
    if (cap) {
      ladder[level - 1].push({ type: 'perk', perk: cap.perk, rank: 1, effect: cap.effect });
      continue;
    }
    if (ladder[level - 1].length) continue;
    const i = next++ % lines.length;
    ranks[i]++;
    const e = lines[i].effect;
    ladder[level - 1].push({
      type: 'perk',
      perk: lines[i].perk,
      rank: ranks[i],
      effect: level >= LATE_PERK_FROM ? halfOf(e) : { ...e },
    });
  }
  return ladder;
}

/** Levels with nothing to unlock: the content check fails on any. */
export const emptyLevels = (ladder: Ladder): number[] =>
  ladder.flatMap((unlocks, i) => (unlocks.length ? [] : [i + 1]));
