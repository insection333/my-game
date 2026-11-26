// Tempering gear with boss trophies (session 216, the plan *Dead and short content, 23 November*): gear was
// linear (a tier's piece the same for everyone who wears it) and a boss's Rare find seen again worth only its
// price. At Smithing 90, a worn piece is tempered a step with its own tier's bars and a boss's Rare find, its
// trophy: a weapon only by the trophies of bosses who fight in its style (the Ember Wyrm's tempers a staff),
// armour by any. Five steps a piece: a weapon's step is +1% damage (+5% whole), an armour piece's a fifteenth of
// the set's 10% less damage taken (session 225: at 1% a step the armour's fifteen steps were held under 10%,
// so its last five took bars and trophies for nothing while each piece claimed 5%), held small as the
// steading's gains are. Kept by the piece (the kind of item), in Smithing's part of the save; read by the
// fighter here, as the steading is.
import type { State } from '@idle-clash/kernel';
import type { GearSlot } from '@idle-clash/content';
import { z } from 'zod';
import { itemOf } from './catalog.ts';
import { BOSSES } from './expeditions/data.ts';
import { heirloomCost, HEIRLOOMS, heirloomOf } from './heirlooms.ts';
import { partReader } from './part.ts';

export const TEMPER = {
  /** The Smithing level that opens it. */
  OPENS: 90,
  STEPS: 5,
  /** A weapon's step in damage, in percent. */
  PCT: 1,
  /** The armour's most, in damage taken, in percent: the three pieces tempered whole. */
  CAP: 10,
  /** A step's bars of the piece's tier, and its trophies: both times the step (the fifth: 100 bars, 5). */
  BARS: 20,
} as const;

/** The tiers' bars, named here: a feature never imports another. */
const BARS = ['copper', 'bronze', 'iron', 'steel', 'moonsilver', 'star-iron', 'embersteel', 'dawnsteel'].map(
  (t) => `${t}-bar`,
);

const ItemId = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
export const TemperState = z.object({ tempered: z.record(ItemId, z.number().int().min(1).max(5)) }).strict();
export type TemperState = z.infer<typeof TemperState>;
const EMPTY: TemperState = { tempered: {} };

/** Smithing's part of the save: the steps each piece has been tempered. */
export const temperOf: (state: State) => TemperState = partReader('smithing', TemperState, EMPTY);

/** The steps a piece has been tempered. */
export const stepsOf = (state: State, item: string): number => {
  const t = temperOf(state).tempered;
  return Object.hasOwn(t, item) ? t[item] : 0;
};

/** The trophies a piece can be tempered with: a weapon's style's bosses' Rare finds, or any boss's. */
export function trophiesFor(item: string): string[] {
  const gear = itemOf(item)?.gear;
  // An heirloom is never tempered (session 251).
  if (!gear || heirloomOf(item)) return [];
  return BOSSES.filter((b) => gear.slot !== 'weapon' || b.style === gear.style).map((b) => b.finds.rare);
}

/** What a piece's next step (1 to 5) takes: its tier's bars and that many trophies. */
export function stepCost(item: string, step: number): { bar: string; bars: number; trophies: number } | null {
  const gear = itemOf(item)?.gear;
  if (!gear) return null;
  return { bar: BARS[gear.tier - 1], bars: TEMPER.BARS * step, trophies: step };
}

/** An armour step's share of the set's guard: a fifteenth of it, so every step counts. */
export const ARMOUR_STEP = TEMPER.CAP / (3 * TEMPER.STEPS);

/** Steps of armour as damage taken off, in percent, to a tenth. */
export const guardOf = (steps: number): number => Math.round(steps * ARMOUR_STEP * 10) / 10;

/** What the worn set's tempering gives a fighter: damage from the weapon, less taken from the armour. */
export function temperGains(state: State, worn: (slot: GearSlot) => string | null): { damage: number; guard: number } {
  const steps = (slot: GearSlot) => {
    const id = worn(slot);
    return id ? stepsOf(state, id) : 0;
  };
  const armour = steps('helm') + steps('body') + steps('legs');
  return { damage: steps('weapon') * TEMPER.PCT, guard: Math.min(TEMPER.CAP, armour * ARMOUR_STEP) };
}

/** Whether a boss's Rare find is still wanted as a trophy: some gear held that it suits is not fully tempered,
 *  or its boss's heirloom is not yet held (session 251). */
export function trophyWanted(state: State, find: string): boolean {
  const forging = HEIRLOOMS.some(
    (h) => !((state.items[h.item] ?? 0) > 0) && heirloomCost(h).some((c) => c.item === find),
  );
  return (
    forging ||
    Object.keys(state.items).some(
      (id) => (state.items[id] ?? 0) > 0 && trophiesFor(id).includes(find) && stepsOf(state, id) < TEMPER.STEPS,
    )
  );
}

/** The bosses' Rare finds, the trophies: the style each suits (a weapon of it; armour takes any). */
export const TROPHY_STYLE: Readonly<Record<string, string>> = Object.fromEntries(
  BOSSES.map((b) => [b.finds.rare, b.style]),
);
