// Shared by the expedition tests: a fighter at the top of a region, and one run from setting out to
// coming home on the real engine.
import { tierOf, XP_TABLE } from '@idle-clash/content';
import { createEngine, HOUR, newState, seeded, type GameEvent, type State } from '@idle-clash/kernel';
import { actionRegistry, FEATURES } from '../../src/index.ts';
import { FOES, FOODS, regionOf } from '../../src/shared/combat/data.ts';
import type { Region } from '../../src/shared/expeditions/data.ts';
import { expeditionsOf } from '../../src/shared/expeditions/state.ts';
import { nextRoute, type Hours } from '../../src/expeditions/route.ts';
import { setOut } from '../../src/expeditions/routes.ts';

export const T0 = Date.UTC(2026, 9, 28, 1);
export const engine = createEngine(actionRegistry(FEATURES, () => true));
const items = FEATURES.flatMap((f) => f.content.items ?? []);
export const STYLE = { march: 'magic', fen: 'melee', peaks: 'archery' } as const;

/** A fighter at the top of a region: its last foe's level in every combat skill, that tier's gear in
 *  their style, and plenty of the best food. */
export function fighterAt(region: Region, seed = 1, style: 'melee' | 'archery' | 'magic' = STYLE[region]): State {
  const level = Math.min(99, FOES.filter((f) => regionOf(f.tier) === region).at(-1)!.level + 2);
  const tier = tierOf(level);
  const gear = (slot: string) =>
    items.find((i) => i.gear?.tier === tier && i.gear.slot === slot && (slot !== 'weapon' || i.gear.style === style))!
      .id;
  const worn = { weapon: gear('weapon'), helm: gear('helm'), body: gear('body'), legs: gear('legs') };
  const food = [...FOODS].reverse().find((f) => f.level <= level)!;
  return {
    ...newState(seed, T0),
    skills: { [style]: { xp: XP_TABLE[level] }, hitpoints: { xp: XP_TABLE[level] } },
    items: { ...Object.fromEntries(Object.values(worn).map((id) => [id, 1])), [food.id]: 50_000 },
    features: { combat: { worn, health: null, healthAt: 0, retreated: null } },
  };
}

/** Runs one expedition from setting out to coming home: the state after, how long, and its story. */
export function runOnce(region: Region, hours: Hours, seed: number) {
  let s = fighterAt(region, seed);
  const road = nextRoute(s, region, hours)!.roads[seed % 2];
  s = setOut(s, region, hours, road).state;
  s = engine.command(
    s,
    T0,
    { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: region } },
    seeded(seed),
  ).state;
  // Back each half hour, so time away never runs out.
  const events: GameEvent[] = [];
  let at = T0;
  while (expeditionsOf(s).run && at < T0 + (hours + 2) * HOUR) {
    at += HOUR / 2;
    const out = engine.advance({ ...s, lastSeen: at }, at, seeded(seed));
    s = out.state;
    events.push(...out.events);
  }
  const home = events.find((e) => e.type === 'expeditionDone');
  return { state: s, home, took: (home?.at ?? at) - T0 };
}
