// Combat's part of the save: what is worn, health as of a moment (it returns with time), and the
// last retreat. Combat writes it; the Storehouse and goals read it through these helpers.
import { masteryStep, type GearSlot, type Style } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { z } from 'zod';
import { itemOf } from '../catalog.ts';
import { perksAt, skillLevel } from '../skill.ts';
import { FOODS, HITPOINTS, LADDERS, type Foe } from './data.ts';
import { maxHealth, regenPerSecond, type Fighter, type Meal } from './fight.ts';

const ItemId = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
export const CombatState = z
  .object({
    worn: z
      .object({ weapon: ItemId.optional(), helm: ItemId.optional(), body: ItemId.optional(), legs: ItemId.optional() })
      .strict(),
    /** Health as of `healthAt`; null is full. */
    health: z.number().nonnegative().nullable(),
    healthAt: z.number().int().nonnegative(),
    /** The last fight that ended in a retreat, so the lane can say why it stopped. */
    retreated: z.object({ foe: ItemId, at: z.number().int().nonnegative() }).strict().nullable(),
  })
  .strict();
export type CombatState = z.infer<typeof CombatState>;

export function combatOf(state: State): CombatState {
  const parsed = CombatState.safeParse(Object.hasOwn(state.features, 'combat') ? state.features.combat : undefined);
  return parsed.success ? parsed.data : { worn: {}, health: null, healthAt: 0, retreated: null };
}

export const setCombat = (state: State, c: CombatState): void => {
  state.features.combat = c;
};

/** The gear worn in a slot, if the player still has it. */
export function wornIn(state: State, slot: GearSlot): string | null {
  const id = combatOf(state).worn[slot];
  return id && countOf(state, id) > 0 ? id : null;
}

/** The style the worn weapon fights with, or null with none worn. */
export const styleOf = (state: State): Style | null => {
  const w = wornIn(state, 'weapon');
  return w ? (itemOf(w)?.gear?.style ?? null) : null;
};

const hitpointsPart = (state: State) => {
  const hpLevel = skillLevel(state, HITPOINTS);
  return { hpLevel, hpPerks: perksAt(LADDERS.hitpoints, hpLevel) };
};

/** The fighter the state makes against a foe, or null without a weapon. */
export function fighterOf(state: State, foe: Foe): Fighter | null {
  const style = styleOf(state);
  if (!style) return null;
  const styleLevel = skillLevel(state, style);
  const tierOf = (slot: GearSlot) => {
    const id = wornIn(state, slot);
    return id ? (itemOf(id)?.gear?.tier ?? 0) : 0;
  };
  const key = `combat:${foe.id}`;
  return {
    style,
    styleLevel,
    weaponTier: tierOf('weapon'),
    armour: tierOf('helm') + tierOf('body') + tierOf('legs'),
    ...hitpointsPart(state),
    perks: perksAt(LADDERS[style], styleLevel),
    mastery: masteryStep(Object.hasOwn(state.mastery, key) ? state.mastery[key] : 0),
  };
}

/** Most health first; the food carried, best first. */
export const mealsOf = (state: State): Meal[] =>
  [...FOODS]
    .sort((a, b) => b.heals - a.heals)
    .map((f) => ({ item: f.id, heals: f.heals, count: countOf(state, f.id) }))
    .filter((m) => m.count > 0);

export const healthMax = (state: State) => maxHealth(hitpointsPart(state));

/** Health at a moment: what was left after the last fight, plus what has returned since. */
export function healthAt(state: State, at: number): number {
  const c = combatOf(state);
  const most = healthMax(state);
  if (c.health === null) return most;
  return Math.min(most, c.health + (regenPerSecond(hitpointsPart(state)) * Math.max(0, at - c.healthAt)) / 1000);
}
