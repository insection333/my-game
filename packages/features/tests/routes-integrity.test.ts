// No sequence of a player's own requests can spoil their save or make something from nothing: every
// feature route and every command, with any input its schema accepts, in any order and with time
// passing between, leaves a save that reads back without a repair, and a refusal changes nothing.
import { GEAR_SLOTS, XP_TABLE } from '@idle-clash/content';
import { HOUR, mend, newState, SAVE_VERSION, seeded, type Command, type State } from '@idle-clash/kernel';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../src/index.ts';
import { relics } from '../src/shared/expeditions/relics.ts';
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
  relic: fc.constantFrom(...relics().map((r) => r.id), 'no-such-relic'),
  skill: fc.constantFrom(...SKILLS, 'no-such-skill'),
  path: fc.constantFrom('bounty', 'lore', 'fortune', null),
  kind: fc.constantFrom('title', 'banner', 'frame'),
  id: fc.constantFrom('woad', 'the-kindled', 'no-such-honour', null),
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
  if (route === 'buy') {
    expect(held(after, input.item) - held(before, input.item)).toBe(input.count);
    expect(gold).toBeLessThan(0);
  }
}

function play(start: State, plan: Step[]) {
  let state = start;
  let t = T0;
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
      { numRuns: 60 },
    );
  });

  it('leave a veteran’s save sound, and a refusal changes nothing', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), steps, (seed, plan) => play(veteran(seed), plan)),
      { numRuns: 60 },
    );
  });
});
