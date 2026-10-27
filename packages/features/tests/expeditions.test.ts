// Expeditions and bosses (step 16), in the real engine: no two routes alike in 1,000 draws; a run of
// any length pays at least as well as the same time against the region's best foe in the lane; a run
// comes home with its story; a retreat ends it where it stands; a boss rests a day after it is fought
// alone; relics cost marks and work.
import { TIER_LEVELS, TIER_SECONDS, TIER_XP_PER_HOUR, tierOf, XP_TABLE } from '@idle-clash/content';
import { countOf, createEngine, HOUR, newState, seeded, type GameEvent, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';
import { itemOf, skillActions } from '../src/shared/catalog.ts';
import { FOES, FOODS, regionOf } from '../src/shared/combat/data.ts';
import { capacity } from '../src/shared/storehouse.ts';
import { REGIONS, type Region } from '../src/shared/expeditions/data.ts';
import { expeditionsOf } from '../src/shared/expeditions/state.ts';
import { relicFoodHeal, relicXpPct } from '../src/shared/expeditions/relics.ts';
import { nextRoute, runFoes, type Hours } from '../src/expeditions/route.ts';
import { buyRelic, setOut } from '../src/expeditions/routes.ts';
import { stageCount } from '../src/expeditions/stage.ts';

const T0 = Date.UTC(2026, 9, 28, 1);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const items = FEATURES.flatMap((f) => f.content.items ?? []);
const STYLE = { march: 'magic', fen: 'melee', peaks: 'archery' } as const;

/** A fighter at the top of a region: its last foe's level in every combat skill, that tier's gear in
 *  their style, and plenty of the best food. */
function fighterAt(region: Region, seed = 1, style: 'melee' | 'archery' | 'magic' = STYLE[region]): State {
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

/** What a state is worth: gold, every item at its price (food at the vendor's), and every XP at what
 *  an hour of the tier's gathering pays for its XP. */
function worth(s: State, tier: number): number {
  const log = skillActions()
    .find((x) => x.skill === 'woodcutting')!
    .actions.find((a) => a.level === TIER_LEVELS[tier - 1])!.gives![0].item;
  const goldPerXp = ((3600 / TIER_SECONDS[tier - 1]) * itemOf(log)!.value) / TIER_XP_PER_HOUR[tier - 1];
  const price = (id: string) => FOODS.find((f) => f.id === id)?.price ?? itemOf(id)?.value ?? 0;
  const things = Object.entries(s.items).reduce((n, [id, c]) => n + (id === 'gold' ? c : c * price(id)), 0);
  return things + Object.values(s.skills).reduce((n, x) => n + x.xp, 0) * goldPerXp;
}

/** Runs one expedition from setting out to coming home: the state after, how long, and its story. */
function runOnce(region: Region, hours: Hours, seed: number) {
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

describe('routes', () => {
  it('are never the same twice in 1,000 draws, in any region and length', () => {
    for (const region of REGIONS)
      for (const hours of [1, 2, 4, 8] as Hours[]) {
        let s = fighterAt(region, 3);
        const seen = new Set<string>();
        for (let k = 0; k < 1000; k++) {
          const route = nextRoute(s, region, hours)!;
          seen.add(JSON.stringify(route));
          s = setOut(s, region, hours, route.roads[0]).state;
        }
        expect(seen.size, `${region}, ${hours} h`).toBe(1000);
      }
  });

  it('meet the three foes of the region the fighter fares best against', () => {
    const s = fighterAt('fen', 4);
    const route = nextRoute(s, 'fen', 8)!;
    const foes = new Set(route.stages.map((x) => x.foe));
    const best = runFoes(s, 'fen').map((f) => f.id);
    expect(best).toHaveLength(3);
    expect([...foes].every((f) => best.includes(f))).toBe(true);
    expect(nextRoute({ ...newState(1, T0) }, 'peaks', 1)).toBeNull();
  });
});

describe('a run', () => {
  it('comes home with its story: stages cleared, the boss, marks', () => {
    const { state, home } = runOnce('march', 1, 5);
    expect(home).toMatchObject({
      type: 'expeditionDone',
      region: 'march',
      hours: 1,
      outcome: 'won',
      boss: 'troll-chief',
    });
    expect(home && home.type === 'expeditionDone' && home.cleared).toBe(
      home && home.type === 'expeditionDone' && home.stages,
    );
    expect(expeditionsOf(state).marks).toBeGreaterThan(5);
    expect(expeditionsOf(state).runs['1']).toBe(1);
    expect(state.lanes.combat.current).toBeNull();
  });

  it('pays at least as well as the same time against the region best foe in the lane, at every length', () => {
    for (const region of REGIONS) {
      const tier = tierOf(Math.min(99, FOES.filter((f) => regionOf(f.tier) === region).at(-1)!.level + 2));
      const start = fighterAt(region);
      const best = runFoes(start, region)[0];
      for (const hours of [1, 2, 4, 8] as Hours[]) {
        const runs = hours <= 2 ? 8 : hours === 4 ? 4 : 2;
        let [gained, took, lane] = [0, 0, 0];
        for (let k = 0; k < runs; k++) {
          const run = runOnce(region, hours, 10 + k);
          gained += worth(run.state, tier) - worth(fighterAt(region, 10 + k), tier);
          took += run.took;
          // The same time in the lane against its best foe.
          let s = engine.command(
            fighterAt(region, 10 + k),
            T0,
            { type: 'start', lane: 'combat', action: { feature: 'combat', id: best.id } },
            seeded(10 + k),
          ).state;
          for (let at = T0; at < T0 + run.took;) {
            at = Math.min(T0 + run.took, at + HOUR / 2);
            s = engine.advance({ ...s, lastSeen: at }, at, seeded(10 + k)).state;
          }
          lane += worth(s, tier) - worth(fighterAt(region, 10 + k), tier);
        }
        expect(gained / took, `${region}, ${hours} h against the lane's ${best.id}`).toBeGreaterThanOrEqual(
          lane / took,
        );
      }
    }
  }, 120_000);

  it('ends where it stands on a retreat: what it won is kept, the boss is not reached', () => {
    let s = fighterAt('fen', 6);
    s = { ...s, items: Object.fromEntries(Object.entries(s.items).filter(([id]) => !FOODS.some((f) => f.id === id))) };
    s.skills.hitpoints = { xp: XP_TABLE[60] };
    s = setOut(s, 'fen', 8, nextRoute(s, 'fen', 8)!.roads[0]).state;
    s = engine.command(
      s,
      T0,
      { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: 'fen' } },
      seeded(6),
    ).state;
    const out = engine.advance({ ...s, lastSeen: T0 + 9 * HOUR }, T0 + 9 * HOUR, seeded(6));
    const home = out.events.find((e) => e.type === 'expeditionDone');
    expect(home).toMatchObject({ outcome: 'retreated' });
    expect(expeditionsOf(out.state).run).toBeNull();
    expect(countOf(out.state, 'gold')).toBeGreaterThan(0);
  });
});

describe('a boss', () => {
  it('fought alone, rests until the next day', () => {
    let s = fighterAt('march', 7);
    const start = { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: 'troll-chief' } } as const;
    s = engine.command(s, T0, start, seeded(7)).state;
    const out = engine.advance({ ...s, lastSeen: T0 + HOUR }, T0 + HOUR, seeded(7));
    expect(expeditionsOf(out.state).wins['troll-chief']).toBe(1);
    expect(out.events.find((e) => e.type === 'laneStopped')).toMatchObject({ reason: { code: 'bossRested' } });
    const tomorrow = Date.UTC(2026, 9, 29, 1);
    expect(engine.command(out.state, tomorrow, start, seeded(7)).result).toEqual({ ok: true });
  });
});

describe('relics', () => {
  it('cost marks rank by rank, and do what they say', () => {
    let s = fighterAt('march', 8);
    s.features.expeditions = { ...expeditionsOf(s), marks: 40 };
    expect(buyRelic(s, 'no-such-relic').result).toEqual({ ok: false, reason: 'unknown' });
    s = buyRelic(s, 'hearthstone').state;
    s = buyRelic(s, 'relic-magic').state;
    expect(expeditionsOf(s).marks).toBe(20);
    expect(buyRelic(s, 'hearthstone').result).toEqual({ ok: false, reason: 'marks' });
    expect(relicFoodHeal(s)).toBe(4);
    expect(relicXpPct(s, 'magic')).toBe(1);
    const before = capacity(s);
    s.features.expeditions = { ...expeditionsOf(s), marks: 10 };
    s = buyRelic(s, 'builders-cord').state;
    expect(capacity(s)).toBe(before + 6);
    expect(
      stageCount({
        stages: [
          { foe: 'x', after: null },
          { foe: 'x', after: null },
          { foe: 'x', after: null },
          { foe: 'x', after: null },
        ],
        twists: ['old-roads'],
      }),
    ).toBe(3);
  });
});
