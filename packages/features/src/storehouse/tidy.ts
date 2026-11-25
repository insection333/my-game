// Old gear sold at one press, and locks (session 241). Smithing for XP leaves stacks of swords, staves and
// helms behind as the player climbs, each taking a space until sold from its own panel; gear two tiers or more
// below what the player may now wear in its slot (a weapon by its style's level, armour by Hitpoints) is sold
// together, after asking, but never a piece worn, one of a piece tempered, or a piece locked. Gear has no other
// use (the pedlar, the realm's work and the steading take materials), so nothing is lost but the spaces.
import { TIER_LEVELS } from '@idle-clash/content';
import { countOf, give, take, type State } from '@idle-clash/kernel';
import { itemOf } from '../shared/catalog.ts';
import { HITPOINTS } from '../shared/combat/data.ts';
import { combatOf } from '../shared/combat/state.ts';
import { skillLevel } from '../shared/skill.ts';
import { isLocked, LOCKS, storeOf, type StoreState } from '../shared/storehouse.ts';
import { stepsOf } from '../shared/temper.ts';

/** How far below what the player may wear a piece must be to count as old. */
export const OLD_BY = 2;

/** The highest tier a level allows. */
const tierAt = (level: number) => TIER_LEVELS.filter((l) => l <= level).length;

/** The old gear held, each with how many go: all but a worn or tempered piece's one. */
export function oldGear(state: State): { item: string; count: number }[] {
  const worn = Object.values(combatOf(state).worn);
  return Object.keys(state.items).flatMap((item) => {
    const gear = itemOf(item)?.gear;
    if (!gear || isLocked(state, item) || !(itemOf(item)!.value > 0)) return [];
    const level = skillLevel(state, gear.slot === 'weapon' ? gear.style! : HITPOINTS);
    if (gear.tier > tierAt(level) - OLD_BY) return [];
    const keep = worn.includes(item) || stepsOf(state, item) > 0 ? 1 : 0;
    const count = countOf(state, item) - keep;
    return count > 0 ? [{ item, count }] : [];
  });
}

export type SellGearResult =
  { ok: true; gold: number; kinds: number } | { ok: false; reason: { code: 'nothingToSell' } };

/** Sells the old gear held at the vendor's price. */
export function sellGear(state: State): { state: State; result: SellGearResult } {
  const held = oldGear(state);
  if (!held.length) return { state, result: { ok: false, reason: { code: 'nothingToSell' } } };
  const next = structuredClone(state);
  let gold = 0;
  for (const { item, count } of held) {
    take(next, item, count);
    gold += itemOf(item)!.value * count;
  }
  give(next, 'gold', gold);
  return { state: next, result: { ok: true, gold, kinds: held.length } };
}

export type LockResult = { ok: true } | { ok: false; reason: { code: 'unknown' | 'tooMany' } };

/** Locks an item against selling, or lets it go. */
export function setLock(state: State, item: string, on: boolean): { state: State; result: LockResult } {
  if (!itemOf(item)) return { state, result: { ok: false, reason: { code: 'unknown' } } };
  const store = storeOf(state);
  const locked = (store.locked ?? []).filter((id) => id !== item);
  if (on && locked.length >= LOCKS) return { state, result: { ok: false, reason: { code: 'tooMany' } } };
  const next = structuredClone(state);
  const out: StoreState = { ...store, locked: on ? [...locked, item] : locked };
  if (!out.locked!.length) delete out.locked;
  next.features.storehouse = out;
  return { state: next, result: { ok: true } };
}
