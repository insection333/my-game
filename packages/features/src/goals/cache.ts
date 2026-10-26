// The supply cache a short goal or the daily goal pays in (docs/EXPANSION.md, Feel). Opening one is
// a small gamble that never loses: half the goal's worth in gold is certain, and one draw adds more.
// On average a cache is worth about what the goal paid in gold before (1.05 times), so the economy
// holds. The draw is the save's own randomness, counted by caches opened, so it is the same on the
// page and on the server.
import { give, seeded, type State } from '@idle-clash/kernel';
import { FOODS, HITPOINTS } from '../shared/combat/data.ts';
import { combatOf } from '../shared/combat/state.ts';
import { skillLevel } from '../shared/skill.ts';
import { noRoom } from '../shared/storehouse.ts';

export type CacheGrade = 'plain' | 'stocked' | 'rich' | 'lucky';
export interface Cache {
  grade: CacheGrade;
  items: { item: string; count: number }[];
}

/** Each grade's chance and what it adds, in shares of the goal's worth. */
export const CACHE_DRAWS: readonly { grade: CacheGrade; chance: number; adds: number }[] = [
  { grade: 'plain', chance: 0.5, adds: 0.3 },
  { grade: 'stocked', chance: 0.3, adds: 0.5 },
  { grade: 'rich', chance: 0.15, adds: 1 },
  { grade: 'lucky', chance: 0.05, adds: 2 },
];
export const CACHE_CERTAIN = 0.5;

/** What the `n`th cache holds for a goal worth `worth` gold. A stocked cache holds the best food the
 *  vendor sells you, when you fight and have room for it; otherwise its worth in gold. */
export function cacheFor(state: State, worth: number, n: number): Cache {
  let roll = seeded(state.seed)('cache', n);
  const draw = CACHE_DRAWS.find((d) => (roll -= d.chance) < 0) ?? CACHE_DRAWS[0];
  const certain = Math.round(worth * CACHE_CERTAIN);
  const extra = Math.round(worth * draw.adds);
  if (draw.grade === 'stocked') {
    const food = [...FOODS].reverse().find((f) => f.level <= skillLevel(state, HITPOINTS))!;
    const fights = combatOf(state).worn.weapon !== undefined;
    const count = Math.max(1, Math.round(extra / food.price));
    if (fights && !noRoom(state, [food.id]))
      return {
        grade: draw.grade,
        items: [
          { item: 'gold', count: certain },
          { item: food.id, count },
        ],
      };
  }
  return { grade: draw.grade, items: [{ item: 'gold', count: certain + extra }] };
}

/** Opens a cache into the state (changed in place): its items given. */
export function openCache(state: State, cache: Cache): void {
  for (const { item, count } of cache.items) give(state, item, count);
}
