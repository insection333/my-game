// What the year's players know of the world, read once from the real content: every skill's actions,
// what each takes and makes, which action produces each item, and the gear, food and supplies there are.
import { levelFor, STYLES, type Style } from '@idle-clash/content';
import { combatData, FEATURES, type Feature } from '@idle-clash/features';
import { xpOf, type State } from '@idle-clash/kernel';

export interface Act {
  feature: string;
  skill: string;
  id: string;
  level: number;
  seconds: number;
  xp: number;
  takes: { item: string; count: number }[];
  needs: string[];
  gives: { item: string; count: number }[];
}

export const GATHERING = ['woodcutting', 'mining', 'fishing', 'runecraft'] as const;
export const ARTISAN = ['smithing', 'cooking', 'fletching'] as const;
export const COMBAT: readonly Style[] = STYLES;
export const ALL_SKILLS = [...GATHERING, ...ARTISAN, ...COMBAT, combatData.HITPOINTS];

const skillFeatures: Feature[] = FEATURES.filter((f) => f.content.skill && f.content.actions?.length);
export const ACTS: Act[] = skillFeatures.flatMap((f) =>
  f.content.actions!.flatMap((a) =>
    a.seconds && a.xp !== undefined
      ? [
          {
            feature: f.id,
            skill: f.content.skill!.id,
            id: a.id,
            level: a.level,
            seconds: a.seconds,
            xp: a.xp,
            takes: [...(a.takes ?? [])],
            needs: (a.needs ?? []).map((n) => n.item),
            gives: [...(a.gives ?? [])],
          },
        ]
      : [],
  ),
);
export const actsOf = (skill: string) => ACTS.filter((a) => a.skill === skill);

/** The actions that make an item, best yield first. */
const producers = new Map<string, Act[]>();
for (const a of ACTS) for (const g of a.gives) producers.set(g.item, [...(producers.get(g.item) ?? []), a]);
for (const [item, list] of producers) list.sort((x, y) => perSecond(y, item) - perSecond(x, item));
export const madeBy = (item: string): Act[] => producers.get(item) ?? [];
export function perSecond(a: Act, item: string): number {
  return (a.gives.find((g) => g.item === item)?.count ?? 0) / a.seconds;
}

export const level = (state: State, skill: string) => levelFor(xpOf(state, skill));
export const have = (state: State, item: string) => (Object.hasOwn(state.items, item) ? state.items[item] : 0);

/** Whether an action is open now: its level reached and anything it needs kept (a key) in hand. */
export const open = (state: State, a: Act) =>
  level(state, a.skill) >= a.level && a.needs.every((n) => have(state, n) > 0);

/** How many times an action can run on what is held. */
export const repsHeld = (state: State, a: Act) =>
  Math.min(Infinity, ...a.takes.map((t) => Math.floor(have(state, t.item) / t.count)));

/** The best XP a second among a skill's open actions, ignoring what they take. */
export const bestRate = (state: State, skill: string) =>
  Math.max(
    0,
    ...actsOf(skill)
      .filter((a) => open(state, a))
      .map((a) => a.xp / a.seconds),
  );
