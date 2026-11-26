// Your odds as the state stands, worked out once for each fighter, foe and food: the 1,000 fights are
// not free, and the Combat page, the goals and the simulation all ask, some of them every second.
import type { State } from '@idle-clash/kernel';
import type { Foe } from './data.ts';
import { odds, type Odds } from './fight.ts';
import { fighterOf, mealsOf } from './state.ts';
import { asFought } from '../bounty.ts';

/** Odds remembered, the least lately asked let go first (session 272: at 500 the whole cache was emptied, and the
 *  realm's boss alone asks about twenty a player, so a realm of some twenty players emptied it again and again, each
 *  time playing a thousand fights a foe afresh: 200 ms on the server's one thread for a player two years in). */
export const ODDS_KEPT = 10_000;
const cache = new Map<string, Odds>();
let played = 0;
/** How many odds were played rather than remembered, for the test. */
export const oddsPlayed = (): number => played;

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
  if (o) cache.delete(key);
  else {
    o = odds(p, foe, meal && { item: meal.item, heals: meal.heals });
    played++;
    if (cache.size >= ODDS_KEPT) cache.delete(cache.keys().next().value!);
  }
  cache.set(key, o);
  return o;
}
