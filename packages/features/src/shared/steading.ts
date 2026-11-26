// The steading (session 25): the works the player raises around the Hearth with gold and their own
// materials, each in five stages, each stage a small lasting gain and a change to the Hearth's scene.
// It is where gold goes once the Storehouse is fully enlarged (the year's simulation found 950 million
// gold by the year's end with nothing to buy). Shared, because the lanes' work, the fighter and the
// expeditions each read the work that touches them here. From the sixth stage (session 244) a work also takes
// the Uncommon finds of the skills it serves, which had no use but the vendor and the pedlar's three a day,
// and each later stage gives half what an earlier one did.
import type { State } from '@idle-clash/kernel';
import { z } from 'zod';
import { partReader } from './part.ts';

export const STAGES = 10;
/** The stage a work flies its pennant at, the first five's last; the later stages take finds. */
export const PENNANT = 5;
/** Each stage's gold, in order. */
export const STAGE_GOLD = [
  50_000, 500_000, 3_000_000, 15_000_000, 20_000_000, 1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000,
];
/** Each stage's materials: how many of each, and from which tier. */
export const STAGE_COUNT = [200, 600, 1_500, 3_000, 6_000, 4_000, 4_500, 5_000, 5_500, 6_000];
export const STAGE_TIER = [1, 3, 5, 6, 8, 8, 8, 8, 8, 8];
/** Each later stage's finds: how many of each of the work's two finds (stages 6 to 10), and of each's greater
 *  find at the tenth. */
export const STAGE_FINDS = [60, 90, 150, 240, 360];
export const GREATER_FINDS = 60;
/** Each find's greater find, from the same skill. */
export const GREATER: Readonly<Record<string, string>> = {
  'birds-nest': 'amber-nugget',
  'rough-garnet': 'rough-sapphire',
  'pearl-mussel': 'river-pearl',
  'wild-herbs': 'saffron-threads',
  'heron-quill': 'hawk-feather',
  'chalk-stub': 'cracked-rune',
  'lucky-horseshoe': 'masterwork-rivets',
  'battle-trophy': 'raiders-war-horn',
  'goose-fletchings': 'hunters-charm',
  'glimmer-stone': 'wisp-lantern',
};

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
  /** The two Uncommon finds its later stages take, of the skills it serves. */
  finds: readonly [string, string];
}

export const WORKS: readonly Work[] = [
  // The gathering skills' finds; the artisans'; the styles'; the fishers' and cooks'; a lookout's; runes and gems.
  { id: 'woodyard', effect: 'gatherYield', pct: 2, of: ['logs'], finds: ['birds-nest', 'rough-garnet'] },
  { id: 'workshop', effect: 'artisanSave', pct: 2, of: ['bars'], finds: ['lucky-horseshoe', 'heron-quill'] },
  { id: 'training-yard', effect: 'damage', pct: 1, of: ['ore', 'logs'], finds: ['battle-trophy', 'glimmer-stone'] },
  { id: 'smokehouse', effect: 'foodHeal', pct: 3, of: ['fish', 'logs'], finds: ['pearl-mussel', 'wild-herbs'] },
  { id: 'watchtower', effect: 'marks', pct: 5, of: ['bars', 'logs'], finds: ['goose-fletchings', 'birds-nest'] },
  { id: 'shrine', effect: 'xp', pct: 1, of: ['runes'], finds: ['chalk-stub', 'rough-garnet'] },
];
export const workById = (id: string) => WORKS.find((w) => w.id === id);

/** What a work gives at `stage`, in percent: its percent for each of the first five, half of it for each after. */
export const workPct = (work: Work, stage: number): number =>
  work.pct * Math.min(stage, PENNANT) + (work.pct / 2) * Math.max(0, stage - PENNANT);

/** What raising a work to `stage` (1 to 10) costs: gold, its materials, and from the sixth its finds. */
export function stageCost(work: Work, stage: number): { gold: number; items: { item: string; count: number }[] } {
  const i = stage - 1;
  const each = Math.round(STAGE_COUNT[i] / work.of.length);
  const finds = stage > PENNANT ? work.finds.map((item) => ({ item, count: STAGE_FINDS[stage - PENNANT - 1] })) : [];
  const greater = stage === STAGES ? work.finds.map((f) => ({ item: GREATER[f], count: GREATER_FINDS })) : [];
  return {
    gold: STAGE_GOLD[i],
    items: [...work.of.map((f) => ({ item: FAMILY[f][STAGE_TIER[i] - 1], count: each })), ...finds, ...greater],
  };
}

/** The finds the steading's next stages ask (session 244), by item: what Sell finds keeps back for them, as
 *  it keeps the pedlar's. Only a work past its pennant asks; each find counted once for every work it goes to. */
export function steadingKeeps(state: State, item: string): number {
  let n = 0;
  for (const w of WORKS) {
    const stage = stageOf(state, w.id);
    if (stage < PENNANT || stage >= STAGES) continue;
    n += stageCost(w, stage + 1).items.find((i) => i.item === item)?.count ?? 0;
  }
  return n;
}

/** The works whose later stages take a find, for its Used in. */
export const worksTaking = (item: string): Work[] =>
  WORKS.filter((w) => w.finds.includes(item) || w.finds.some((f) => GREATER[f] === item));

export const SteadingState = z
  .object({ stages: z.record(z.string().regex(/^[a-z][a-z-]{0,31}$/), z.number().int().min(0).max(STAGES)) })
  .strict();
export type SteadingState = z.infer<typeof SteadingState>;
const EMPTY: SteadingState = Object.freeze({ stages: Object.freeze({}) });

/** The steading in a save; a part that does not read is as if nothing were built yet. */
export const steadingOf: (state: State) => SteadingState = partReader('steading', SteadingState, EMPTY);
export const stageOf = (state: State, work: string): number => {
  const stages = steadingOf(state).stages;
  return Object.hasOwn(stages, work) ? stages[work] : 0;
};

/** What the steading gives now for one effect, in percent. */
const gain = (state: State, effect: WorkEffect): number => {
  const stages = steadingOf(state).stages;
  return WORKS.filter((w) => w.effect === effect).reduce(
    (n, w) => n + workPct(w, Object.hasOwn(stages, w.id) ? stages[w.id] : 0),
    0,
  );
};

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
