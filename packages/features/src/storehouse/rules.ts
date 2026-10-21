// The Storehouse's routes (GAME_DESIGN.md section 10): selling to the vendor, buying food from it,
// and enlarging the Storehouse. Pure: each takes the state and returns a new one and an answer.
import { countOf, give, take, type State } from '@idle-clash/kernel';
import { itemOf } from '../shared/catalog.ts';
import { FOODS, HITPOINTS } from '../shared/combat/data.ts';
import { combatOf } from '../shared/combat/state.ts';
import { skillLevel } from '../shared/skill.ts';
import { ENLARGE_COSTS, noRoom, storeOf } from '../shared/storehouse.ts';

type Refusal<C extends string> = { ok: false; reason: { code: C; detail?: Record<string, string | number> } };
export type SellResult = { ok: true; gold: number } | Refusal<'notSellable' | 'notEnough' | 'wornItem'>;
export type BuyResult = { ok: true; gold: number } | Refusal<'notSold' | 'notEnoughGold' | 'storehouseFull'>;
export type EnlargeResult = { ok: true } | Refusal<'fullyEnlarged' | 'notEnoughGold'>;

/** What the vendor pays for one; legendary finds are kept, so they sell for nothing. */
export const priceOf = (item: string): number => itemOf(item)?.value ?? 0;

/** Foods the vendor sells to a player at this Hitpoints level. */
export const foodsFor = (state: State) => FOODS.filter((f) => f.level <= skillLevel(state, HITPOINTS));

export function sell(state: State, item: string, count: number): { state: State; result: SellResult } {
  const each = priceOf(item);
  if (each <= 0) return { state, result: { ok: false, reason: { code: 'notSellable' } } };
  if (countOf(state, item) < count) return { state, result: { ok: false, reason: { code: 'notEnough' } } };
  const worn = Object.values(combatOf(state).worn).includes(item);
  if (worn && countOf(state, item) === count) return { state, result: { ok: false, reason: { code: 'wornItem' } } };
  const next = structuredClone(state);
  take(next, item, count);
  give(next, 'gold', each * count);
  return { state: next, result: { ok: true, gold: each * count } };
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
  next.features.storehouse = { enlargements: enlargements + 1 };
  return { state: next, result: { ok: true } };
}
