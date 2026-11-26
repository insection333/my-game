// Wearing and removing gear: combat's own routes. A weapon needs its style at the tier's level, armour
// needs Hitpoints at it; the item must be in the Storehouse. Pure: a new state and an answer.
import { fmt, GEAR_SLOTS, STYLES, t, TIER_LEVELS, type GearSlot, type Style } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { itemOf } from '../shared/catalog.ts';
import { heirloomWords } from '../shared/heirloom-view.ts';
import { ARMOUR_GUARD_PER_TIER, HITPOINTS, WEAPON_HIT_PER_TIER } from '../shared/combat/data.ts';
import { combatOf, setCombat } from '../shared/combat/state.ts';
import { stepsOf } from '../shared/temper.ts';
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

/** What a piece does in a fight, in words (session 51): a weapon's style (which wearing it changes the
 *  fighter to: session 80) and how much its tier raises the most a swing can roll, armour's share off every
 *  hit; the very numbers fight() uses. */
export function gearDoes(item: string): string | null {
  const gear = itemOf(item)?.gear;
  if (!gear) return null;
  const base =
    gear.slot === 'weapon'
      ? t('gear.does.weapon', {
          style: t(`skill.${gear.style}`),
          hit: fmt.int(WEAPON_HIT_PER_TIER * gear.tier),
        })
      : t('gear.does.armour', { pct: fmt.pct(ARMOUR_GUARD_PER_TIER * gear.tier) });
  // An heirloom's trait beside it (session 251).
  const trait = heirloomWords(item);
  return trait ? `${base}. ${trait}` : base;
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

/** What a piece is worth to wear: its tier, then its tempering. */
const worthOf = (state: State, id: string) => itemOf(id)!.gear!.tier * 10 + stepsOf(state, id);

/** The best piece held for a slot that the player may wear (session 241): the highest tier, then the most
 *  tempered; a weapon of the style asked. */
export function bestIn(state: State, slot: GearSlot, style?: Style): string | null {
  const held = Object.keys(state.items).filter((id) => {
    const gear = itemOf(id)?.gear;
    if (!gear || gear.slot !== slot || countOf(state, id) < 1) return false;
    if (slot === 'weapon' && gear.style !== style) return false;
    const needs = wearNeeds(id)!;
    return skillLevel(state, needs.skill) >= needs.level;
  });
  return held.sort((a, b) => worthOf(state, b) - worthOf(state, a) || a.localeCompare(b))[0] ?? null;
}

/** The styles a player could fight as now: those with a weapon held that they may wear. */
export const stylesHeld = (state: State): Style[] => STYLES.filter((style) => bestIn(state, 'weapon', style));

/** The gear the best for a style would put on, slot by slot: only what is better than what is worn (a piece
 *  as good is left on). */
export function bestChanges(state: State, style: Style): { slot: GearSlot; item: string }[] {
  const worn = combatOf(state).worn;
  return GEAR_SLOTS.flatMap((slot) => {
    const best = bestIn(state, slot, style);
    const on = worn[slot];
    // A piece as good is left on: a weapon of the style asked (session 252: worn, the Troll-chief's blade tied
    // with an untempered dawnsteel sword, lost the tie by name, and Fight as Melee took it off).
    const keep =
      on &&
      countOf(state, on) > 0 &&
      (slot !== 'weapon' || itemOf(on)?.gear?.style === style) &&
      worthOf(state, on) >= worthOf(state, best ?? on);
    return best && !keep ? [{ slot, item: best }] : [];
  });
}

export type WearBestResult = { ok: true; changed: number } | { ok: false; reason: { code: 'noWeapon' } };

/** Puts on the best held for a style (session 241): its weapon and the best armour, one press where switching
 *  style took a press a piece on the gear sheet. */
export function wearBest(state: State, style: Style): { state: State; result: WearBestResult } {
  if (!bestIn(state, 'weapon', style)) return { state, result: { ok: false, reason: { code: 'noWeapon' } } };
  const changes = bestChanges(state, style);
  if (!changes.length) return { state, result: { ok: true, changed: 0 } };
  const next = structuredClone(state);
  const c = combatOf(next);
  setCombat(next, { ...c, worn: { ...c.worn, ...Object.fromEntries(changes.map((x) => [x.slot, x.item])) } });
  return { state: next, result: { ok: true, changed: changes.length } };
}
