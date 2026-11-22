// Your odds as the state stands, worked out once for each fighter, foe and food: the 1,000 fights are
// not free, and the Combat page, the goals and the simulation all ask, some of them every second.
import type { State } from '@idle-clash/kernel';
import type { Foe } from './data.ts';
import { odds, type Odds } from './fight.ts';
import { fighterOf, mealsOf } from './state.ts';
import { asFought } from '../bounty.ts';

const cache = new Map<string, Odds>();

export function oddsFor(state: State, base: Foe): Odds | null {
  // An elite foe while its bounty is held (session 175): the odds of the fight the lane will play.
  const foe = asFought(state, base);
  const p = fighterOf(state, foe);
  if (!p) return null;
  const meal = mealsOf(state)[0] ?? null;
  // Everything the fights depend on: the whole fighter (its perks and supply too, which the Training yard,
  // relics and a whetstone carried change), the foe and the meal as it heals (the Smokehouse).
  const key = JSON.stringify([p, foe.id, foe.hp, foe.maxHit, meal?.item, meal?.heals]);
  let o = cache.get(key);
  if (!o) {
    if (cache.size > 500) cache.clear();
    o = odds(p, foe, meal && { item: meal.item, heals: meal.heals });
    cache.set(key, o);
  }
  return o;
}
