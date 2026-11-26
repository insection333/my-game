// No sequence of a player's own requests can spoil their save or make something from nothing: every
// feature route and every command, with any input its schema accepts, in any order and with time
// passing between, leaves a save that reads back without a repair, and a refusal changes nothing.
import { GEAR_SLOTS, XP_TABLE } from '@idle-clash/content';
import { HOUR, mend, newState, SAVE_VERSION, seeded, type Command, type State } from '@idle-clash/kernel';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../src/index.ts';
import { FOES } from '../src/shared/combat/data.ts';
import { relics } from '../src/shared/expeditions/relics.ts';
import { DEEP_RELICS } from '../src/shared/expeditions/deep-relics.ts';
import { SEASON_EPOCH } from '../src/shared/season.ts';
import { weekOf } from '../src/shared/week-time.ts';
import { expeditionsOf, setExpeditions } from '../src/shared/expeditions/state.ts';
import { allSkills } from '../src/shared/standing.ts';
import { engine, T0 } from './helpers/expedition.ts';

const ITEMS = FEATURES.flatMap((f) => (f.content.items ?? []).map((i) => i.id));
const ACTIONS = FEATURES.flatMap((f) => (f.content.actions ?? []).map((a) => ({ feature: f.id, id: a.id })));
const SKILLS = allSkills();
const LANES = ['gathering', 'gathering2', 'artisan', 'combat'] as const;
const ROUTES = FEATURES.flatMap((f) => Object.entries(f.routes).map(([name, route]) => ({ f, name, route })));

/** Values for each field a route takes, by its name: real ids and some that are not. */
const POOL: Record<string, fc.Arbitrary<unknown>> = {
  item: fc.constantFrom(...ITEMS, 'gold', 'no-such-item'),
  count: fc.constantFrom(1, 2, 7, 50, 1_000, 1_000_000_000),
  slot: fc.constantFrom(...GEAR_SLOTS),
  goal: fc.constantFrom('chop-a-pine', 'daily', 'no-such-goal'),
  region: fc.constantFrom('march', 'fen', 'peaks'),
  hours: fc.constantFrom(1, 2, 4, 8),
  road: fc.constantFrom('high-pass', 'low-road', 'no-such-road'),
  relic: fc.constantFrom(...relics().map((r) => r.id), ...DEEP_RELICS, 'no-such-relic'),
  skill: fc.constantFrom(...SKILLS, 'no-such-skill'),
  path: fc.constantFrom('bounty', 'lore', 'fortune', null),
  // An honour's kind, or a pedlar's lot (session 217).
  kind: fc.constantFrom(
    'title',
    'banner',
    'frame',
    'picture',
    'companion',
    'glow',
    'badge',
    'scene',
    'find',
    'material',
    'dish',
  ),
  // Sessions 191 and 218: the quartermaster's lots, gold given to the realm's work.
  lots: fc.constantFrom(1, 3, 1_000, 1_000_000),
  gold: fc.constantFrom(0, 1, 999, 1_000, 2_500_000, 1e12),
  // An honour, a deed to follow (session 242) or a gift by its number (session 254; the save is told of 1 and 2).
  id: fc.constantFrom('woad', 'the-kindled', 'squirrel', 'no-such-honour', null, 'level-woodcutting-40', 1, 2, 3),
  // Session 260: whether a run sets out again, a deed is followed, an item locked; a style to fight as.
  on: fc.boolean(),
  style: fc.constantFrom('melee', 'archery', 'magic'),
  // Sessions 172 to 179: a bounty's foe, the week's task to swap.
  foe: fc.constantFrom(...FOES.map((f) => f.id), 'no-such-foe'),
  task: fc.constantFrom(0, 1, 3, 4, -1),
  action: fc.constantFrom(...ACTIONS),
};

type Step =
  | { kind: 'route'; at: number; route: number; input: Record<string, unknown> }
  | { kind: 'command'; at: number; command: Command }
  | { kind: 'wait'; at: number };

const routeStep = fc.integer({ min: 0, max: ROUTES.length - 1 }).chain((route) => {
  const example = ROUTES[route].route.example as Record<string, unknown>;
  const fields = Object.fromEntries(Object.keys(example).map((k) => [k, POOL[k] ?? fc.constant(example[k])]));
  return fc.record({
    kind: fc.constant('route' as const),
    at: fc.integer({ min: 0, max: 30 * 60_000 }),
    route: fc.constant(route),
    input: fc.record(fields),
  });
});
const commandStep = fc.record({
  kind: fc.constant('command' as const),
  at: fc.integer({ min: 0, max: 10 * 60_000 }),
  command: fc.oneof(
    fc.record({
      type: fc.constant('start' as const),
      lane: fc.constantFrom(...LANES),
      action: fc.constantFrom(...ACTIONS),
    }),
    fc.record({
      type: fc.constant('queueNext' as const),
      lane: fc.constantFrom(...LANES),
      action: fc.constantFrom(...ACTIONS),
    }),
    fc.record({ type: fc.constantFrom('stop' as const, 'clearNext' as const), lane: fc.constantFrom(...LANES) }),
    // One of the three to come, by its place (session 240).
    fc.record({
      type: fc.constant('clearNext' as const),
      lane: fc.constantFrom(...LANES),
      at: fc.integer({ min: 0, max: 2 }),
    }),
    fc.constant({ type: 'stoke' as const }),
  ),
});
const waitStep = fc.record({ kind: fc.constant('wait' as const), at: fc.integer({ min: 0, max: 9 * HOUR }) });
const steps = fc.array(fc.oneof(routeStep, routeStep, commandStep, waitStep), { minLength: 1, maxLength: 30 });

/** A player well along: every skill at 99, plenty of everything, gold and marks to spend. */
function veteran(seed: number): State {
  const state: State = {
    ...newState(seed, T0),
    skills: Object.fromEntries(SKILLS.map((s) => [s, { xp: XP_TABLE[99] }])),
    items: { ...Object.fromEntries(ITEMS.map((i) => [i, 500])), gold: 50_000_000 },
  };
  setExpeditions(state, { ...expeditionsOf(state), marks: 2_000 });
  // The realm's week as the server tells it (session 174): fallen with this player's strike, a share owed.
  state.features.realm = {
    week: weekOf(T0),
    needed: 8,
    strikes: 9,
    mine: 2,
    fell: true,
    owed: { week: weekOf(T0), boss: 'troll-chief' },
  };
  // Two friends' gifts waiting (session 254).
  state.features.gifts = {
    waiting: [
      { id: 1, from: 'Alder', at: T0 - HOUR },
      { id: 2, from: 'Birch', at: T0 - HOUR },
    ],
  };
  return state;
}

function sound(state: State, now: number) {
  const doc = { version: SAVE_VERSION, state, requests: [] };
  expect(mend(JSON.parse(JSON.stringify(doc)), now).repairs).toEqual([]);
  for (const [id, n] of Object.entries(state.items)) {
    if (!Number.isSafeInteger(n) || n < 0) throw new Error(`${id} held ${n}`);
  }
}

/** Selling and buying trade exactly what they say: nothing is made from nothing. */
function exchanged(route: string, input: Record<string, unknown>, before: State, after: State) {
  const held = (s: State, item: unknown) => s.items[item as string] ?? 0;
  const gold = held(after, 'gold') - held(before, 'gold');
  if (route === 'sell') {
    expect(held(before, input.item) - held(after, input.item)).toBe(input.count);
    expect(gold).toBeGreaterThan(0);
  }
  if (route === 'give' && input.item === undefined) expect(gold).toBe(-(input.gold as number));
  if (route === 'buy') {
    expect(held(after, input.item) - held(before, input.item)).toBe(input.count);
    expect(gold).toBeLessThan(0);
  }
}

function play(start: State, plan: Step[], from = T0) {
  let state = start;
  let t = from;
  const rng = seeded(start.seed);
  for (const step of plan) {
    t += step.at;
    if (step.kind === 'wait') state = engine.input(state, t, rng).state;
    else if (step.kind === 'command') state = engine.command(state, t, step.command, rng).state;
    else {
      const { route } = ROUTES[step.route];
      const input = route.input.safeParse(step.input);
      if (!input.success) continue;
      // As the server does: the world is brought up to now, then the route runs.
      state = engine.input(state, t, rng).state;
      const before = JSON.stringify(state);
      const out = route.run(state, input.data, t);
      if (!(out.result as { ok: boolean }).ok) expect(JSON.stringify(out.state)).toBe(before);
      else exchanged(ROUTES[step.route].name, input.data as Record<string, unknown>, state, out.state);
      state = out.state;
    }
    sound(state, t);
  }
}

describe('the routes and commands, in any order', () => {
  it('leave a newcomer’s save sound, and a refusal changes nothing', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), steps, (seed, plan) => play(newState(seed, T0), plan)),
      { numRuns: Number(process.env.RUNS ?? 60) },
    );
  });

  it('leave a veteran’s save sound in a season, its realm’s work standing, and a refusal changes nothing', () => {
    // Session 225: in a season, so the realm's work takes gifts, the Deep holds its season's omen and the realm's
    // boss bears its mark.
    const IN = SEASON_EPOCH + 10 * 86_400_000;
    const inSeason = (seed: number): State => {
      const s = { ...veteran(seed), clock: IN };
      s.features['realm-work'] = {
        season: 1,
        work: 'beacon',
        needed: 40_000_000,
        given: 1_000_000,
        mine: 0,
        givers: 1,
        finished: 0,
        thanks: null,
      };
      s.features.realm = { ...(s.features.realm as object), week: weekOf(IN), owed: null };
      return s;
    };
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), steps, (seed, plan) => play(inSeason(seed), plan, IN)),
      { numRuns: Number(process.env.RUNS ?? 60) },
    );
  });

  it('leave a veteran’s save sound, and a refusal changes nothing', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), steps, (seed, plan) => play(veteran(seed), plan)),
      { numRuns: Number(process.env.RUNS ?? 60) },
    );
  });
});
