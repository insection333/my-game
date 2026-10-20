// The kernel's central promise: advancing a to b to c gives exactly what a to c gives, whatever the
// split points, the commands in between, and the lanes running.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  createEngine,
  HOUR,
  LANE_IDS,
  MINUTE,
  newState,
  seeded,
  State,
  type Command,
  type GameEvent,
} from '../src/index.ts';
import { A, registry, T0 } from './fixtures.ts';

const engine = createEngine(registry);
const actions = Object.values(A);

const command: fc.Arbitrary<Command> = fc.oneof(
  fc.record({
    type: fc.constant('start' as const),
    lane: fc.constantFrom(...LANE_IDS),
    action: fc.constantFrom(...actions),
  }),
  fc.record({
    type: fc.constant('queueNext' as const),
    lane: fc.constantFrom(...LANE_IDS),
    action: fc.constantFrom(...actions),
  }),
  fc.record({ type: fc.constant('stop' as const), lane: fc.constantFrom(...LANE_IDS) }),
  fc.record({ type: fc.constant('clearNext' as const), lane: fc.constantFrom(...LANE_IDS) }),
  fc.constant({ type: 'stoke' as const }),
);

const scenario = fc.record({
  seed: fc.nat(),
  ore: fc.nat({ max: 200 }),
  bread: fc.nat({ max: 50 }),
  /** Commands at offsets from T0, in milliseconds. */
  commands: fc.array(fc.tuple(fc.nat({ max: 6 * HOUR }), command), { minLength: 1, maxLength: 12 }),
  /** Extra moments at which the split run also advances. */
  splits: fc.array(fc.nat({ max: 40 * HOUR }), { maxLength: 8 }),
  end: fc.integer({ min: MINUTE, max: 40 * HOUR }),
});

type Scenario = typeof scenario extends fc.Arbitrary<infer T> ? T : never;

function play(sc: Scenario, withSplits: boolean): { state: State; events: GameEvent[] } {
  const rng = seeded(sc.seed);
  let state = newState(sc.seed, T0);
  state.items['copper-ore'] = sc.ore;
  state.items.bread = sc.bread;
  const events: GameEvent[] = [];
  const moments: { at: number; cmd?: Command }[] = sc.commands.map(([dt, cmd]) => ({ at: T0 + dt, cmd }));
  const end = T0 + 6 * HOUR + sc.end;
  if (withSplits) moments.push(...sc.splits.filter((dt) => T0 + dt < end).map((dt) => ({ at: T0 + dt })));
  moments.sort((a, b) => a.at - b.at || (a.cmd ? 1 : -1));
  for (const m of moments) {
    const out = m.cmd ? engine.command(state, m.at, m.cmd, rng) : engine.advance(state, m.at, rng);
    state = out.state;
    events.push(...out.events);
    expect(State.safeParse(state).error).toBeUndefined(); // every state the engine makes is a valid save
  }
  const last = engine.advance(state, end, rng);
  return { state: last.state, events: [...events, ...last.events] };
}

describe('advance composes', () => {
  it('a to b to c equals a to c, with commands, splits and every lane', () => {
    fc.assert(
      fc.property(scenario, (sc) => {
        expect(play(sc, true)).toEqual(play(sc, false));
      }),
      { numRuns: 150 },
    );
  });

  it('holds for one lane split at every possible moment', () => {
    const rng = seeded(9);
    let s = newState(9, T0);
    s.items.bread = 100;
    s = engine.command(s, T0, { type: 'start', lane: 'combat', action: A.rat }, rng).state;
    const whole = engine.advance(s, T0 + HOUR, rng).state;
    for (let b = T0; b <= T0 + HOUR; b += 7 * MINUTE + 1) {
      const split = engine.advance(engine.advance(s, b, rng).state, T0 + HOUR, rng).state;
      expect(split).toEqual(whole);
    }
  });
});
