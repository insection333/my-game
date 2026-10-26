// Session 6's proof: 8 hours away is credited exactly. The engine's answer is checked against an
// independent count written from GAME_DESIGN.md's numbers (seconds, XP, perks, mastery), and against
// the same 8 hours advanced in pieces.
import { XP_TABLE } from '@idle-clash/content';
import { createEngine, HOUR, MINUTE, newState, seeded, type State } from '@idle-clash/kernel';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';

const T0 = Date.UTC(2026, 9, 21, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const pine = { feature: 'woodcutting', id: 'pine-tree' };
const started = (seed: number) =>
  engine.command(newState(seed, T0), T0, { type: 'start', lane: 'gathering', action: pine }, seeded(seed)).state;

// From GAME_DESIGN.md: Pine tree 7.5 s and 11 XP; while the fire burns (5 minutes after the last
// input) +8% XP in its first ten minutes of heat, which is all these five minutes reach; Quick swing 2.5% faster at 2, 7, 12 ...; Practised hands 6% faster mastery at 6, 11 ...;
// mastery steps at 30, 90, 210 ... completions, each 3% faster; a Legendary find's mark +2% XP.
const QUICK = [2, 7, 12, 17, 22, 27, 32, 37];
const PRACTISED = [6, 11, 16, 21, 26, 31, 36];
const STEPS = [30, 90, 210, 450, 900, 1800, 3600, 7200, 14400, 28800];
const levelOf = (xp: number) => XP_TABLE.filter((x, l) => l >= 1 && xp >= x).length;

/** Counts 8 hours of pine by hand: completions, XP (in thousandths) and when the lane is next due. */
function byHand(markFrom: number) {
  const end = T0 + 8 * HOUR;
  const fireUntil = T0 + 5 * MINUTE;
  let [t, n, milli] = [T0, 0, 0];
  for (;;) {
    const level = levelOf(Math.floor(milli / 1000));
    const gain = PRACTISED.filter((l) => l <= level).length * 6;
    const step = STEPS.filter((c) => n * (1 + gain / 100) >= c).length;
    const speed = QUICK.filter((l) => l <= level).length * 2.5 + step * 3;
    const ms = Math.round(7500 / (1 + speed / 100));
    if (t + ms > end) return { n, xp: Math.floor(milli / 1000), part: milli % 1000, nextDue: t + ms };
    t += ms;
    n++;
    const pct = (t < fireUntil ? 8 : 0) + (t >= markFrom ? 2 : 0);
    milli += Math.round(11 * (1 + pct / 100) * 1000);
  }
}

describe('8 hours away', () => {
  it.each([3, 17, 401])('credits every chop, its XP and its mastery exactly (seed %i)', (seed) => {
    const away = engine.advance(started(seed), T0 + 8 * HOUR, seeded(seed)).state;
    const mark = away.found['silverbark-seed'] ?? Infinity;
    const hand = byHand(mark);
    expect(away.mastery['woodcutting:pine-tree']).toBe(hand.n);
    expect(away.skills.woodcutting).toEqual(hand.part ? { xp: hand.xp, part: hand.part } : { xp: hand.xp });
    expect(away.lanes.gathering.current!.endsAt).toBe(hand.nextDue);
    expect(away.items['pine-logs']).toBeGreaterThanOrEqual(hand.n);
    expect(hand.n).toBeGreaterThan(3600);
  });

  it('gives the same 8 hours however the time is cut into pieces', () => {
    const s0 = started(5);
    const whole = engine.advance(s0, T0 + 8 * HOUR, seeded(5)).state;
    fc.assert(
      fc.property(fc.uniqueArray(fc.integer({ min: 1, max: 8 * HOUR - 1 }), { maxLength: 12 }), (cuts) => {
        let s: State = s0;
        for (const c of [...cuts].sort((a, b) => a - b)) s = engine.advance(s, T0 + c, seeded(5)).state;
        expect(engine.advance(s, T0 + 8 * HOUR, seeded(5)).state).toEqual(whole);
      }),
      { numRuns: 25 },
    );
  });
});
