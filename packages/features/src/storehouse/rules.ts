// The Storehouse's routes (GAME_DESIGN.md section 10): selling to the vendor, buying food from it,
// and enlarging the Storehouse. Pure: each takes the state and returns a new one and an answer.
import { countOf, give, take, type State } from '@idle-clash/kernel';
import { findOf, itemOf } from '../shared/catalog.ts';
import { spentFind } from './finds.ts';
import { FOODS, HITPOINTS } from '../shared/combat/data.ts';
import { combatOf } from '../shared/combat/state.ts';
import { pedlarKeeps } from '../shared/pedlar-lots.ts';
import { skillLevel } from '../shared/skill.ts';
import { ENLARGE_COSTS, isLocked, noRoom, storeOf } from '../shared/storehouse.ts';

type Refusal<C extends string> = { ok: false; reason: { code: C; detail?: Record<string, string | number> } };
export type SellResult = { ok: true; gold: number } | Refusal<'notSellable' | 'notEnough' | 'wornItem' | 'locked'>;
export type BuyResult = { ok: true; gold: number } | Refusal<'notSold' | 'notEnoughGold' | 'storehouseFull'>;
export type SellFindsResult = { ok: true; gold: number; kinds: number } | Refusal<'nothingToSell'>;
export type EnlargeResult = { ok: true } | Refusal<'fullyEnlarged' | 'notEnoughGold'>;

/** What the vendor pays for one; legendary finds are kept, so they sell for nothing. */
export const priceOf = (item: string): number => itemOf(item)?.value ?? 0;

/** Foods the vendor sells to a player at this Hitpoints level. */
export const foodsFor = (state: State) => FOODS.filter((f) => f.level <= skillLevel(state, HITPOINTS));

export function sell(state: State, item: string, count: number): { state: State; result: SellResult } {
  const each = priceOf(item);
  if (each <= 0) return { state, result: { ok: false, reason: { code: 'notSellable' } } };
  if (countOf(state, item) < count) return { state, result: { ok: false, reason: { code: 'notEnough' } } };
  if (isLocked(state, item)) return { state, result: { ok: false, reason: { code: 'locked' } } };
  const worn = Object.values(combatOf(state).worn).includes(item);
  if (worn && countOf(state, item) === count) return { state, result: { ok: false, reason: { code: 'wornItem' } } };
  const next = structuredClone(state);
  take(next, item, count);
  give(next, 'gold', each * count);
  return { state: next, result: { ok: true, gold: each * count } };
}

/** The finds kept to sell (session 187): every Uncommon find held, none used anywhere (a test holds it), and
 *  every Rare find with no use left (session 192), so selling them all loses nothing but their spaces. The
 *  pedlar's find of the day is kept back, three of it, until handed in (session 226). */
export function findsToSell(state: State, at: number): { item: string; count: number }[] {
  return Object.keys(state.items)
    .filter(
      (id) => (findOf(id)?.rarity === 'uncommon' || spentFind(state, id)) && priceOf(id) > 0 && !isLocked(state, id),
    )
    .map((item) => ({ item, count: countOf(state, item) - pedlarKeeps(state, at, item) }))
    .filter((x) => x.count > 0);
}

export const keptToSell = (state: State, at: number): string[] => findsToSell(state, at).map((x) => x.item);

/** Sells every find kept to sell, all of each but the pedlar's, at the vendor's price. */
export function sellFinds(state: State, at: number): { state: State; result: SellFindsResult } {
  const held = findsToSell(state, at);
  if (!held.length) return { state, result: { ok: false, reason: { code: 'nothingToSell' } } };
  const next = structuredClone(state);
  let gold = 0;
  for (const { item, count } of held) {
    take(next, item, count);
    gold += priceOf(item) * count;
  }
  give(next, 'gold', gold);
  return { state: next, result: { ok: true, gold, kinds: held.length } };
}

export function buy(state: State, item: string, count: number): { state: State; result: BuyResult } {
  const food = foodsFor(state).find((f) => f.id === item);
  if (!food) return { state, result: { ok: false, reason: { code: 'notSold' } } };
  const cost = food.price * count;
  if (countOf(state, 'gold') < cost) return { state, result: { ok: false, reason: { code: 'notEnoughGold' } } };
  if (noRoom(state, [item])) return { state, result: { ok: false, reason: { code: 'storehouseFull' } } };
  const next = structuredClone(state);
  take(next, 'gold', cost);
  give(next, item, count);
  return { state: next, result: { ok: true, gold: cost } };
}

export function enlarge(state: State): { state: State; result: EnlargeResult } {
  const { enlargements } = storeOf(state);
  if (enlargements >= ENLARGE_COSTS.length) return { state, result: { ok: false, reason: { code: 'fullyEnlarged' } } };
  const cost = ENLARGE_COSTS[enlargements];
  if (countOf(state, 'gold') < cost) return { state, result: { ok: false, reason: { code: 'notEnoughGold' } } };
  const next = structuredClone(state);
  take(next, 'gold', cost);
  next.features.storehouse = { ...storeOf(state), enlargements: enlargements + 1 };
  return { state: next, result: { ok: true } };
}
