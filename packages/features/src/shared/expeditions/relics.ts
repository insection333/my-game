// Relics: lasting boosts bought with marks, each in ranks (GAME_DESIGN.md section 9). One for each
// skill (+1% XP a rank), the hearthstone (food heals 4% more a rank), the four-leaf charm (finds 4%
// more likely a rank), five ranks each; and the builder's cord (six more Storehouse spaces a rank,
// three ranks). Every skill, the fighter and the Storehouse read their relic here.
import type { State } from '@idle-clash/kernel';
import { allSkills } from '../standing.ts';
import { expeditionsOf } from './state.ts';

/** What each rank costs in marks, in order. */
export const RELIC_COSTS = [10, 25, 50, 90, 150];

export type RelicEffect =
  | { kind: 'xp'; skill: string; pct: number }
  | { kind: 'foodHeal'; pct: number }
  | { kind: 'finds'; pct: number }
  | { kind: 'slots'; amount: number };

export interface Relic {
  id: string;
  ranks: number;
  /** What one rank gives. */
  effect: RelicEffect;
}

export const SKILL_XP_PER_RANK = 1;
export const FOOD_HEAL_PER_RANK = 4;
export const FINDS_PER_RANK = 4;
export const SLOTS_PER_RANK = 6;
export const STORE_RANKS = 3;

let list: Relic[] | null = null;
/** Every relic: made once, after the registry has loaded every skill. */
export const relics = (): readonly Relic[] =>
  (list ??= [
    ...allSkills().map((skill): Relic => ({
      id: `relic-${skill}`,
      ranks: 5,
      effect: { kind: 'xp', skill, pct: SKILL_XP_PER_RANK },
    })),
    { id: 'hearthstone', ranks: 5, effect: { kind: 'foodHeal', pct: FOOD_HEAL_PER_RANK } },
    { id: 'four-leaf-charm', ranks: 5, effect: { kind: 'finds', pct: FINDS_PER_RANK } },
    { id: 'builders-cord', ranks: STORE_RANKS, effect: { kind: 'slots', amount: SLOTS_PER_RANK } },
  ]);

export const relicById = (id: string) => relics().find((r) => r.id === id);

export const rankOf = (state: State, id: string): number => {
  const ranks = expeditionsOf(state).relics;
  return Object.hasOwn(ranks, id) ? ranks[id] : 0;
};

/** Extra XP in a skill from its relic, in percent. */
export const relicXpPct = (state: State, skill: string): number => rankOf(state, `relic-${skill}`) * SKILL_XP_PER_RANK;
/** How much more food heals, in percent. */
export const relicFoodHeal = (state: State): number => rankOf(state, 'hearthstone') * FOOD_HEAL_PER_RANK;
/** How much more likely finds are, in percent. */
export const relicFindPct = (state: State): number => rankOf(state, 'four-leaf-charm') * FINDS_PER_RANK;
/** Extra Storehouse spaces. */
export const relicSlots = (state: State): number => rankOf(state, 'builders-cord') * SLOTS_PER_RANK;
