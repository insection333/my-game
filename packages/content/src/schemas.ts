// Shared content schemas: ids, items and the unlock ladder every skill has.
import { z } from 'zod';
import { Effect } from './effects.ts';
import { MAX_LEVEL } from './progression.ts';

export const Id = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'ids are lower case letters, digits and hyphens');

export const Item = z
  .object({
    id: Id,
    kind: z.enum(['resource', 'gear', 'food', 'find']),
    /** What the vendor pays for one. */
    value: z.number().int().nonnegative(),
  })
  .strict();
export type Item = z.infer<typeof Item>;

export const Level = z.number().int().min(1).max(MAX_LEVEL);

export const Unlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('action'), action: Id }).strict(),
  z.object({ type: z.literal('perk'), perk: Id, rank: z.number().int().min(1).max(39), effect: Effect }).strict(),
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

/** Levels with nothing to unlock: the content check fails on any. */
export const emptyLevels = (ladder: Ladder): number[] =>
  ladder.flatMap((unlocks, i) => (unlocks.length ? [] : [i + 1]));
