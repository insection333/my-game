// A year's player's housekeeping on each visit: gear worn, food bought, the Storehouse tidied and
// enlarged, relics raised, Paths taken at 99, goals claimed and deeds recorded. Each goes through the
// feature's own route, as the page sends it.
import { TIER_LEVELS, type Style } from '@idle-clash/content';
import { combatData, FEATURES, kindlingData, storehouseData, type GoalsView } from '@idle-clash/features';
import type { GameEvent, State } from '@idle-clash/kernel';
import { itemOf } from '../../../packages/features/src/shared/catalog.ts';
import { rankOf, RELIC_COSTS, relics } from '../../../packages/features/src/shared/expeditions/relics.ts';
import { ACTS, ALL_SKILLS, ARTISAN, have, level } from './world.ts';
import { behind } from './plan.ts';

const feature = (id: string) => FEATURES.find((f) => f.id === id)!;
const route = (state: State, f: string, r: string, input: unknown, now: number) =>
  feature(f).routes[r].run(state, input, now) as {
    state: State;
    result: { ok: boolean };
    events?: GameEvent[];
  };
const tierAt = (lvl: number) => TIER_LEVELS.filter((l) => l <= lvl).length;
const worn = (state: State) => (state.features.combat as { worn?: Record<string, string> } | undefined)?.worn ?? {};

/** The best gear held that the player's levels allow, worn for a style. */
export function equip(state: State, style: Style, now: number): State {
  let s = state;
  const best = (slot: string, lvl: number, st?: string) =>
    Object.keys(s.items)
      .filter((id) => {
        const g = have(s, id) > 0 ? itemOf(id)?.gear : undefined;
        return g && g.slot === slot && (st === undefined || g.style === st) && g.tier <= tierAt(lvl);
      })
      .sort((a, b) => itemOf(b)!.gear!.tier - itemOf(a)!.gear!.tier)[0];
  const pieces = [
    best('weapon', level(s, style), style),
    ...['helm', 'body', 'legs'].map((slot) => best(slot, level(s, combatData.HITPOINTS))),
  ];
  for (const item of pieces)
    if (item && !Object.values(worn(s)).includes(item)) s = route(s, 'combat', 'wear', { item }, now).state;
  return s;
}

/** The style to train: the furthest behind that has a weapon to fight with. */
export function styleToTrain(state: State): Style | null {
  const armed = (st: string) =>
    Object.keys(state.items).some((id) => have(state, id) > 0 && itemOf(id)?.gear?.style === st);
  return (behind(state, ['melee', 'archery', 'magic']).find(armed) as Style | undefined) ?? null;
}

/** Food: enough meals for a day away, the vendor's best topping up what Cooking made. */
export function feed(state: State, now: number, meals = 400): State {
  const held = combatData.FOODS.reduce((n, f) => n + have(state, f.id), 0) + cooked(state);
  const food = [...combatData.FOODS].reverse().find((f) => f.level <= level(state, combatData.HITPOINTS))!;
  const count = Math.min(meals - held, Math.floor((have(state, 'gold') * 0.5) / food.price));
  return count > 0 ? route(state, 'storehouse', 'buy', { item: food.id, count }, now).state : state;
}
const cooked = (state: State) =>
  Object.keys(state.items).reduce((n, id) => n + (itemOf(id)?.kind === 'food' ? have(state, id) : 0), 0) -
  combatData.FOODS.reduce((n, f) => n + have(state, f.id), 0);

/** What is kept: gold, food, keys, worn and best gear, supplies still of use, and everything the top two
 *  tiers of each artisan skill take (with the ore their bars take). The rest is sold. */
function keeps(state: State): Set<string> {
  const keep = new Set<string>(['gold', ...Object.values(worn(state)), ...bestGear(state)]);
  for (const skill of ARTISAN) {
    const t = tierAt(level(state, skill));
    const from = TIER_LEVELS[Math.max(0, t - 2)];
    for (const a of ACTS.filter((x) => x.skill === skill && x.level >= from && x.level <= level(state, skill)))
      for (const i of a.takes) {
        keep.add(i.item);
        for (const s of ACTS.filter((x) => x.skill === 'smithing' && x.gives.some((g) => g.item === i.item)))
          for (const o of s.takes) keep.add(o.item);
      }
  }
  for (const a of ACTS) for (const n of a.needs) keep.add(n);
  for (const id of Object.keys(state.items)) {
    const it = itemOf(id);
    if (it?.kind === 'food') keep.add(id);
    if (
      it?.supply &&
      TIER_LEVELS[it.supply.tier - 1] <= level(state, it.supply.style) &&
      it.supply.tier >= tierAt(level(state, it.supply.style)) - 1
    )
      keep.add(id);
  }
  return keep;
}

/** Gold each item has brought in, all told. */
export const SOLD: Record<string, number> = {};

/** The best piece held of each kind of gear (each style's weapon, each armour slot): kept for the day
 *  the player trains that style. */
function bestGear(state: State): string[] {
  const best = new Map<string, string>();
  for (const id of Object.keys(state.items)) {
    const g = have(state, id) > 0 ? itemOf(id)?.gear : undefined;
    if (!g) continue;
    const kind = `${g.slot}:${g.style ?? ''}`;
    const was = best.get(kind);
    if (!was || itemOf(was)!.gear!.tier < g.tier) best.set(kind, id);
  }
  return [...best.values()];
}

/** Sells what is no longer of use, enlarges while space runs short, then feeds the fighter. */
export function tidy(state: State, now: number): State {
  let s = state;
  const keep = keeps(s);
  for (const [item, n] of Object.entries(s.items))
    if (n > 0 && !keep.has(item)) {
      const before = have(s, 'gold');
      s = route(s, 'storehouse', 'sell', { item, count: n }, now).state;
      SOLD[item] = (SOLD[item] ?? 0) + have(s, 'gold') - before;
    }
  for (;;) {
    const e = storehouseData.storeOf(s).enlargements;
    const cost = storehouseData.ENLARGE_COSTS[e];
    if (
      cost === undefined ||
      storehouseData.slotsUsed(s) < storehouseData.capacity(s) - 20 ||
      have(s, 'gold') < cost * 1.5
    )
      break;
    const r = route(s, 'storehouse', 'enlarge', {}, now);
    if (!r.result.ok) break;
    s = r.state;
  }
  return s;
}

/** Relics bought with the marks held: the builder's cord for room, then the furthest-behind skills'. */
export function raiseRelics(state: State, now: number): { state: State; bought: number } {
  let s = state;
  let bought = 0;
  const order = ['builders-cord', ...behind(s, ALL_SKILLS).map((k) => `relic-${k}`), 'hearthstone', 'four-leaf-charm'];
  const marks = () => (s.features.expeditions as { marks?: number } | undefined)?.marks ?? 0;
  for (const id of order) {
    const r = relics().find((x) => x.id === id);
    while (r && rankOf(s, id) < r.ranks && marks() >= RELIC_COSTS[rankOf(s, id)]) {
      const r = route(s, 'expeditions', 'relic', { relic: id }, now);
      if (!r.result.ok) {
        break;
      }
      s = r.state;
      bought++;
    }
  }
  return { state: s, bought };
}

/** A Path for every skill at 99 without one: Bounty for the skills that make things, Lore for the styles. */
export function takePaths(state: State, now: number): State {
  let s = state;
  const paths = (s.features.kindling as { paths?: Record<string, string> } | undefined)?.paths ?? {};
  for (const skill of kindlingData.pathSkills())
    if (level(s, skill) >= 99 && !Object.hasOwn(paths, skill))
      s = route(
        s,
        'kindling',
        'path',
        { skill, path: ['melee', 'archery', 'magic'].includes(skill) ? 'lore' : 'bounty' },
        now,
      ).state;
  return s;
}

/** Goals claimed as they are done, the ladder refilled; deeds recorded. Returns what they announce. */
export function goalsAndDeeds(state: State, now: number, deeds: boolean): { state: State; events: GameEvent[] } {
  let s = state;
  const events: GameEvent[] = [];
  const view = feature('goals').slots['hearth.goals']({ state: s, now }) as unknown as GoalsView | null;
  if (view?.refresh) s = route(s, 'goals', 'refresh', {}, now).state;
  for (const row of view?.rows ?? []) {
    if (row.state !== 'ready' || !row.button || !('claim' in row.button)) continue;
    const r = route(s, 'goals', 'claim', { goal: row.button.claim }, now);
    s = r.state;
    events.push(...(r.events ?? []));
  }
  if (deeds) {
    const r = route(s, 'deeds', 'refresh', {}, now);
    s = r.state;
    events.push(...(r.events ?? []));
  }
  return { state: s, events };
}
