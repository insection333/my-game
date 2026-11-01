// The steading (session 25): the works the player raises around the Hearth with gold and their own
// materials, each in five stages, each stage a small lasting gain and a change to the Hearth's scene.
// It is where gold goes once the Storehouse is fully enlarged (the year's simulation found 950 million
// gold by the year's end with nothing to buy). Shared, because the lanes' work, the fighter and the
// expeditions each read the work that touches them here.
import type { State } from '@idle-clash/kernel';
import { z } from 'zod';

export const STAGES = 5;
/** Each stage's gold, in order. */
export const STAGE_GOLD = [50_000, 500_000, 3_000_000, 15_000_000, 60_000_000];
/** Each stage's materials: how many of each, and from which tier. */
export const STAGE_COUNT = [200, 600, 1_500, 3_000, 6_000];
export const STAGE_TIER = [1, 3, 5, 6, 8];

/** Each material family's item at each tier (1 to 8), named here: a feature never imports another. */
const FAMILY = {
  logs: ['pine', 'ash', 'oak', 'yew', 'maple', 'silverbark', 'elderwood', 'ancient'].map((t) => `${t}-logs`),
  ore: ['copper-ore', 'tin-ore', 'iron-ore', 'coal', 'moonsilver-ore', 'star-iron-ore', 'ember-ore', 'dawnstone'],
  bars: ['copper', 'bronze', 'iron', 'steel', 'moonsilver', 'star-iron', 'embersteel', 'dawnsteel'].map(
    (t) => `${t}-bar`,
  ),
  fish: ['perch', 'trout', 'pike', 'salmon', 'moon-carp', 'silver-eel', 'ember-char', 'dawn-sturgeon'],
  runes: ['spark', 'gale', 'tide', 'earth', 'moon', 'star', 'ember', 'dawn'].map((t) => `${t}-rune`),
} as const;
type Family = keyof typeof FAMILY;

export type WorkEffect = 'gatherYield' | 'artisanSave' | 'damage' | 'foodHeal' | 'marks' | 'xp';
export interface Work {
  id: string;
  /** What one stage gives, in percent. */
  effect: WorkEffect;
  pct: number;
  /** What it is built of: one or two material families, the count shared between them. */
  of: readonly Family[];
}

export const WORKS: readonly Work[] = [
  { id: 'woodyard', effect: 'gatherYield', pct: 2, of: ['logs'] },
  { id: 'workshop', effect: 'artisanSave', pct: 2, of: ['bars'] },
  { id: 'training-yard', effect: 'damage', pct: 1, of: ['ore', 'logs'] },
  { id: 'smokehouse', effect: 'foodHeal', pct: 3, of: ['fish', 'logs'] },
  { id: 'watchtower', effect: 'marks', pct: 5, of: ['bars', 'logs'] },
  { id: 'shrine', effect: 'xp', pct: 1, of: ['runes'] },
];
export const workById = (id: string) => WORKS.find((w) => w.id === id);

/** What raising a work to `stage` (1 to 5) costs: gold, and its materials. */
export function stageCost(work: Work, stage: number): { gold: number; items: { item: string; count: number }[] } {
  const i = stage - 1;
  const each = Math.round(STAGE_COUNT[i] / work.of.length);
  return {
    gold: STAGE_GOLD[i],
    items: work.of.map((f) => ({ item: FAMILY[f][STAGE_TIER[i] - 1], count: each })),
  };
}

export const SteadingState = z
  .object({ stages: z.record(z.string().regex(/^[a-z][a-z-]{0,31}$/), z.number().int().min(0).max(STAGES)) })
  .strict();
export type SteadingState = z.infer<typeof SteadingState>;
const EMPTY: SteadingState = Object.freeze({ stages: Object.freeze({}) });

/** The steading in a save; a part that does not read is as if nothing were built yet. */
export function steadingOf(state: State): SteadingState {
  const raw = Object.hasOwn(state.features, 'steading') ? state.features.steading : undefined;
  const parsed = SteadingState.safeParse(raw);
  return parsed.success ? parsed.data : EMPTY;
}
export const stageOf = (state: State, work: string): number => {
  const stages = steadingOf(state).stages;
  return Object.hasOwn(stages, work) ? stages[work] : 0;
};

/** What the steading gives now for one effect, in percent. */
const gain = (state: State, effect: WorkEffect): number =>
  WORKS.filter((w) => w.effect === effect).reduce((n, w) => n + stageOf(state, w.id) * w.pct, 0);

/** More of what a gathering action makes (the Woodyard), as extra-item chance. */
export const steadingYieldPct = (state: State) => gain(state, 'gatherYield');
/** A chance to keep an ingredient in the artisan's work (the Workshop). */
export const steadingSavePct = (state: State) => gain(state, 'artisanSave');
/** More damage in every fight (the Training yard). */
export const steadingDamagePct = (state: State) => gain(state, 'damage');
/** Food heals more (the Smokehouse). */
export const steadingFoodHealPct = (state: State) => gain(state, 'foodHeal');
/** Expeditions bring home more marks (the Watchtower). */
export const steadingMarksPct = (state: State) => gain(state, 'marks');
/** More XP in every skill (the Shrine). */
export const steadingXpPct = (state: State) => gain(state, 'xp');
