// Session 7's proof, part one: every lane stop says why. Random players with random stock give random
// commands over random stretches of time; every lane that stops and every command refused carries a
// reason that is declared (by the kernel or the feature) and reads as plain words.
import { formatStop, XP_TABLE } from '@idle-clash/content';
import {
  createEngine,
  KERNEL_STOP_CODES,
  LANE_IDS,
  MINUTE,
  newState,
  seeded,
  type GameEvent,
  type State,
} from '@idle-clash/kernel';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';

const T0 = Date.UTC(2026, 9, 21, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const declared = new Set<string>([...KERNEL_STOP_CODES, ...FEATURES.flatMap((f) => f.stops)]);
const actions = FEATURES.flatMap((f) => Object.keys(f.rules).map((id) => ({ feature: f.id, id })));
const items = [...new Set(FEATURES.flatMap((f) => (f.content.items ?? []).map((i) => i.id)))];

const command = fc.oneof(
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
  fc.constant({ type: 'stoke' as const }),
);
const start = fc.record({
  levels: fc.dictionary(fc.constantFrom('woodcutting', 'mining', 'smithing'), fc.integer({ min: 1, max: 40 })),
  stock: fc.dictionary(fc.constantFrom(...items), fc.integer({ min: 0, max: 40 })),
});

describe('every lane stop says why', () => {
  it('in any order of commands, over any stretch of time', () => {
    fc.assert(
      fc.property(
        start,
        fc.array(fc.tuple(command, fc.integer({ min: 0, max: 90 * MINUTE })), { minLength: 1, maxLength: 25 }),
        fc.integer({ min: 0, max: 2 ** 31 }),
        ({ levels, stock }, steps, seed) => {
          let s: State = {
            ...newState(seed, T0),
            items: stock,
            skills: Object.fromEntries(Object.entries(levels).map(([k, l]) => [k, { xp: XP_TABLE[l] }])),
          };
          let t = T0;
          const events: GameEvent[] = [];
          for (const [cmd, wait] of steps) {
            const out = engine.command(s, t, cmd, seeded(seed));
            events.push(...out.events);
            t += wait;
            const away = engine.advance(out.state, t, seeded(seed));
            events.push(...away.events);
            s = away.state;
          }
          for (const e of events) {
            if (e.type !== 'laneStopped' && e.type !== 'refused') continue;
            expect(declared).toContain(e.reason.code);
            const words = formatStop(e.reason);
            expect(words.length).toBeGreaterThan(3);
            expect(words).not.toMatch(/[{}]|undefined|NaN/);
          }
          for (const l of LANE_IDS) {
            const lane = s.lanes[l];
            if (!lane.current && lane.stopped) expect(declared).toContain(lane.stopped.reason.code);
          }
        },
      ),
      { numRuns: 300 },
    );
  });
});

describe('an ingredient that goes mid-action', () => {
  it('makes nothing, counts no mastery, and stops the lane saying what ran out', () => {
    const smelt = { feature: 'smithing', id: 'copper-bar' };
    const s0 = { ...newState(1, T0), items: { 'copper-ore': 5 } };
    const started = engine.command(s0, T0, { type: 'start', lane: 'artisan', action: smelt }, seeded(1)).state;
    const sold = { ...started, items: {} };
    const after = engine.advance(sold, T0 + MINUTE, seeded(1)).state;
    expect(after.items['copper-bar']).toBeUndefined();
    expect(after.mastery['smithing:copper-bar']).toBeUndefined();
    expect(after.lanes.artisan.stopped?.reason).toEqual({ code: 'outOfInputs', detail: { item: 'copper-ore' } });
  });
});
