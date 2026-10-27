// The Storehouse's space (GAME_DESIGN.md section 10): stacks of any size, but a limited number of
// different items. Every producing action asks here before each repetition, so a lane that would
// bring a new kind of item into a full Storehouse stops ("Storehouse full") instead of losing it.
// The storehouse feature writes its part of the save (enlargements); anything may read it.
import { relicSlots } from './expeditions/relics.ts';
import { countOf, type State, type StopReason } from '@idle-clash/kernel';
import { z } from 'zod';

export const START_SLOTS = 24;
export const SLOTS_PER_ENLARGEMENT = 6;
/** Eight enlargements over version 1's three weeks, six more over the climb to 99, five for Fishing's
 *  and Cooking's thirty kinds of item (session 13) and six for the supplies' thirty-nine (session 14). */
export const ENLARGE_COSTS: readonly number[] = [
  40_000, 90_000, 100_000, 120_000, 180_000, 200_000, 230_000, 250_000, 280_000, 300_000, 340_000, 450_000, 460_000,
  650_000, 700_000, 750_000, 800_000, 850_000, 900_000, 925_000, 950_000, 975_000, 1_000_000, 1_000_000, 1_000_000,
];

/** Gold is counted in the header, not in a slot. */
export const SLOTLESS = new Set(['gold']);

export const StoreState = z.object({ enlargements: z.number().int().min(0).max(ENLARGE_COSTS.length) }).strict();
export type StoreState = z.infer<typeof StoreState>;

export function storeOf(state: State): StoreState {
  const parsed = StoreState.safeParse(
    Object.hasOwn(state.features, 'storehouse') ? state.features.storehouse : undefined,
  );
  return parsed.success ? parsed.data : { enlargements: 0 };
}

/** Spaces: the first 24, six for each enlargement, and six for each rank of the builder's cord (a relic). */
export const capacity = (state: State): number =>
  START_SLOTS + SLOTS_PER_ENLARGEMENT * storeOf(state).enlargements + relicSlots(state);

/** Different items held (not gold). */
export const slotsUsed = (state: State): number =>
  Object.keys(state.items).filter((id) => !SLOTLESS.has(id) && countOf(state, id) > 0).length;

/**
 * Whether a repetition that gives these items (and uses up these) fits: a new kind needs a free slot,
 * and an ingredient used up to the last frees one. Null when it fits.
 */
export function noRoom(
  state: State,
  gives: readonly string[],
  takes: readonly { item: string; count: number }[] = [],
): StopReason | null {
  const fresh = new Set(gives.filter((id) => !SLOTLESS.has(id) && countOf(state, id) === 0));
  if (!fresh.size) return null;
  const freed = takes.filter((t) => countOf(state, t.item) === t.count).length;
  return slotsUsed(state) - freed + fresh.size > capacity(state) ? { code: 'storehouseFull' } : null;
}
