// Wearing and removing gear: combat's own routes. A weapon needs its style at the tier's level, armour
// needs Hitpoints at it; the item must be in the Storehouse. Pure: a new state and an answer.
import { TIER_LEVELS, type GearSlot } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { itemOf } from '../shared/catalog.ts';
import { HITPOINTS } from '../shared/combat/data.ts';
import { combatOf, setCombat } from '../shared/combat/state.ts';
import { skillLevel } from '../shared/skill.ts';

export type WearResult =
  | { ok: true }
  | { ok: false; reason: { code: 'notGear' | 'notOwned' } }
  | { ok: false; reason: { code: 'levelTooLow'; detail: { skill: string; level: number } } };

/** Who may wear a piece: its style (a weapon) or Hitpoints (armour), at its tier's level. */
export function wearNeeds(item: string): { skill: string; level: number } | null {
  const gear = itemOf(item)?.gear;
  if (!gear) return null;
  return { skill: gear.style ?? HITPOINTS, level: TIER_LEVELS[gear.tier - 1] };
}

export function wear(state: State, item: string): { state: State; result: WearResult } {
  const gear = itemOf(item)?.gear;
  if (!gear) return { state, result: { ok: false, reason: { code: 'notGear' } } };
  if (countOf(state, item) < 1) return { state, result: { ok: false, reason: { code: 'notOwned' } } };
  const needs = wearNeeds(item)!;
  if (skillLevel(state, needs.skill) < needs.level)
    return { state, result: { ok: false, reason: { code: 'levelTooLow', detail: needs } } };
  const next = structuredClone(state);
  const c = combatOf(next);
  setCombat(next, { ...c, worn: { ...c.worn, [gear.slot]: item } });
  return { state: next, result: { ok: true } };
}

export function remove(state: State, slot: GearSlot): { state: State; result: { ok: true } } {
  const next = structuredClone(state);
  const c = combatOf(next);
  const worn = { ...c.worn };
  delete worn[slot];
  setCombat(next, { ...c, worn });
  return { state: next, result: { ok: true } };
}
