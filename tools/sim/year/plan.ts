// What a year's player sets each lane to: the way a careful player would, from what they hold.
// - Artisan: a missing piece of gear or a key first (one the player's levels can use), then the
//   furthest-behind artisan skill's best recipe it holds the inputs for, with another queued behind it.
// - Gathering: while the artisan lane has less than half a day of work in hand, the gathering action
//   that makes what it lacks most; otherwise the furthest-behind gathering skill's best action.
import { TIER_LEVELS } from '@idle-clash/content';
import { combatData } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';
import { dailyProgress } from '../../../packages/features/src/goals/ladder.ts';
import { goalsOf } from '../../../packages/features/src/goals/state.ts';
import { itemOf } from '../../../packages/features/src/shared/catalog.ts';
import { ACTS, actsOf, ARTISAN, GATHERING, have, level, madeBy, open, repsHeld, type Act } from './world.ts';

const tierAt = (lvl: number) => TIER_LEVELS.filter((l) => l <= lvl).length;
const rate = (a: Act) => a.xp / a.seconds;

/** Skills in the order a balanced player works them: today's daily goal's skill while it is unfinished
 *  (the goal is there to steer by), then those below 99, the lowest level first. */
export const behind = (state: State, skills: readonly string[]) => {
  const daily = goalsOf(state).daily;
  const p = daily && !daily.claimed ? dailyProgress(state, daily) : null;
  const steer = daily && p && p.now < p.of ? daily.skill : null;
  return [...skills].sort((a, b) => {
    const [la, lb] = [level(state, a), level(state, b)];
    return Number(b === steer) - Number(a === steer) || Number(la >= 99) - Number(lb >= 99) || la - lb;
  });
};

/** A skill's open actions, the best XP a second first. */
/** A skill's open actions, the best XP a second first; Smithing trains by smelting while it holds few
 *  bars (bars feed Fletching, gear and keys; gear only spends them), as a careful player does. */
const bestOf = (state: State, skill: string) =>
  actsOf(skill)
    .filter((a) => open(state, a))
    .sort((a, b) => score(state, b) - score(state, a));
const isBar = (a: Act) => a.gives.some((g) => g.item.endsWith('-bar'));
function score(state: State, a: Act): number {
  if (a.skill !== 'smithing') return rate(a);
  const bars = a.takes.find((t) => t.item.endsWith('-bar'));
  const plenty = bars ? have(state, bars.item) >= 2_000 : false;
  return rate(a) * (isBar(a) ? 1.2 : plenty ? 1 : 0.5);
}

/** Gear better than any the player has of its kind, as good as both their levels to use it and their
 *  Smithing to make it allow, and keys Runecraft's next stone needs: what Smithing makes first. */
export function wanted(state: State): string[] {
  const out: string[] = [];
  const recipe = (slot: string, tier: number, style?: string) =>
    ACTS.find((a) => a.skill === 'smithing' && a.gives.some((g) => isGear(g.item, slot, tier, style)));
  const consider = (slot: string, useLevel: number, style?: string) => {
    for (let tier = tierAt(useLevel); tier > ownedTier(state, slot, style); tier--) {
      const r = recipe(slot, tier, style);
      if (r && level(state, 'smithing') >= r.level) return void out.push(r.gives[0].item);
    }
  };
  for (const style of ['melee', 'archery', 'magic']) consider('weapon', level(state, style), style);
  for (const slot of ['helm', 'body', 'legs']) consider(slot, level(state, combatData.HITPOINTS));
  const stone = actsOf('runecraft')
    .filter((a) => level(state, 'runecraft') >= a.level)
    .sort((a, b) => b.level - a.level)[0];
  out.push(...(stone?.needs ?? []).filter((k) => have(state, k) === 0));
  return out;
}
function isGear(item: string, slot: string, tier: number, style?: string): boolean {
  const g = itemOf(item)?.gear;
  return !!g && g.slot === slot && g.tier === tier && (style === undefined || g.style === style);
}
/** The best tier held of a kind of gear (0 for none). */
export function ownedTier(state: State, slot: string, style?: string): number {
  let best = 0;
  for (const [id, n] of Object.entries(state.items)) {
    const g = n > 0 ? itemOf(id)?.gear : undefined;
    if (g && g.slot === slot && (style === undefined || g.style === style)) best = Math.max(best, g.tier);
  }
  return best;
}

/** How a wanted thing is made from what is held: its recipe, or the bar its recipe lacks. */
function makeable(state: State, item: string): Act | null {
  const recipe = madeBy(item).find((a) => level(state, a.skill) >= a.level);
  if (!recipe) return null;
  if (repsHeld(state, recipe) >= 1) return recipe;
  for (const t of recipe.takes) {
    if (have(state, t.item) >= t.count) continue;
    const smelt = madeBy(t.item).find((a) => a.skill === 'smithing' && open(state, a) && repsHeld(state, a) >= t.count);
    if (smelt) return smelt;
  }
  return null;
}

/** The artisan lane's action now and the one queued behind it. */
export function artisanPlan(
  state: State,
  minutes: number,
  leaving: boolean,
): { now: Act | null; next: Act | null; making: string | null } {
  // Gear and keys are made while the player is here to take each piece as it comes, never left
  // running overnight, where the lane would repeat them until the bars ran out.
  for (const item of leaving ? [] : wanted(state)) {
    const a = makeable(state, item);
    if (a) return { now: a, next: mainArtisan(state, minutes, a), making: item };
  }
  const now = mainArtisan(state, minutes, null);
  return { now, next: now ? mainArtisan(state, minutes, now) : null, making: null };
}

/** The furthest-behind artisan skill's best recipe with inputs for `minutes` of work (or, failing that,
 *  for any work), skipping `not`. */
function mainArtisan(state: State, minutes: number, not: Act | null): Act | null {
  const tries = (enough: (a: Act) => boolean) => {
    for (const skill of behind(state, ARTISAN)) {
      const a = bestOf(state, skill).find((x) => x !== not && x.takes.length > 0 && enough(x));
      if (a) return a;
    }
    return null;
  };
  // The furthest-behind skill first: its best recipe, or the bars it lacks smelted from ore held.
  const [first] = behind(state, ARTISAN);
  const top = bestOf(state, first).find((x) => x !== not && x.takes.length > 0);
  if (top && repsHeld(state, top) * top.seconds >= minutes * 60) return top;
  const smelt = top && barsFor(state, top, not);
  if (smelt) return smelt;
  return tries((a) => repsHeld(state, a) * a.seconds >= minutes * 60) ?? tries((a) => repsHeld(state, a) >= 1);
}

/** The smelting that makes a bar a recipe lacks, from ore held. */
function barsFor(state: State, recipe: Act, not: Act | null): Act | null {
  for (const t of recipe.takes) {
    if (have(state, t.item) >= t.count * 60) continue;
    const smelt = madeBy(t.item).find(
      (a) => a !== not && a.skill === 'smithing' && open(state, a) && repsHeld(state, a) >= 10,
    );
    if (smelt) return smelt;
  }
  return null;
}

/** Seconds of work held for the artisan skill furthest behind, at its best recipe. */
export function artisanStock(state: State): number {
  const [first] = behind(state, ARTISAN);
  const best = bestOf(state, first).find((a) => a.takes.length > 0);
  return best ? Math.min(repsHeld(state, best), 1e6) * best.seconds : 0;
}

/** The raw material the furthest-behind artisan skill's best recipe lacks most for a day's work (bars
 *  counted as the ore that smelts them). */
export function scarcest(state: State): string | null {
  const need = new Map<string, number>();
  const add = (item: string, n: number) => need.set(item, (need.get(item) ?? 0) + n);
  for (const skill of behind(state, ARTISAN).slice(0, 1)) {
    const best = bestOf(state, skill).find((a) => a.takes.length > 0);
    if (!best) continue;
    const reps = 86_400 / best.seconds;
    for (const t of best.takes) {
      const smelt = madeBy(t.item).find((a) => a.skill === 'smithing' && level(state, 'smithing') >= a.level);
      if (smelt) for (const o of smelt.takes) add(o.item, reps * t.count * o.count);
      else add(t.item, reps * t.count);
    }
  }
  let worst: string | null = null;
  let short = 0;
  for (const [item, n] of need) {
    const gap = (n - have(state, item)) / n;
    const made = madeBy(item).some((a) => (GATHERING as readonly string[]).includes(a.skill) && open(state, a));
    if (made && gap > short) [worst, short] = [item, gap];
  }
  return worst;
}

/** The gathering action that makes an item best, among those open. */
export const gatherFor = (state: State, item: string): Act | null =>
  madeBy(item).find((a) => (GATHERING as readonly string[]).includes(a.skill) && open(state, a)) ?? null;

/** A gathering skill's best action now. */
export const bestGather = (state: State, skill: string): Act | null => bestOf(state, skill)[0] ?? null;
