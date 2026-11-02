// The day's strongholds (session 38): each pays by its place, the harder more; one breached falls for the
// day (a repelled one may be tried again, twice in all); the fifth to fall is a rout with war marks of its
// own; and a siege on a stronger lord pays more war marks than one on an equal.
import { COMBAT, SIEGE } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import {
  battleAccount,
  bastionRating,
  launch,
  marksReward,
  mercenaries,
  mercenaryBounty,
  mercenaryCosts,
  newCastle,
  resolveMercenary,
  siegeCosts,
  siegeRefusal,
  strongholdMarks,
  strongholdsFallen,
  type Castle,
  type Mercenary,
} from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 2, 12);
const DAY = 86_400_000;

function castle(level = 10): Castle {
  const c = newCastle('lord', T0 - 30 * DAY);
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as Castle['levels'];
  const out = { ...c, levels, shieldUntil: 0, activeAp: 10_000 };
  return { ...out, rating: bastionRating(out) };
}

/** A siege on a stronghold at a roll: high rolls win against the easy ones, roll 0 loses the hard ones. */
function assault(c: Castle, m: Mercenary, roll: number, chest = 1e15) {
  const costs = mercenaryCosts(c, m, T0);
  return resolveMercenary(launch(c, m.id, costs.ap, T0), m, T0, roll, chest);
}

describe("the day's strongholds", () => {
  it('are always five, each paying more than the one before it', () => {
    const c = castle();
    const five = mercenaries(c, T0, 5);
    expect(five.map((m) => m.n)).toEqual([0, 1, 2, 3, 4]);
    const marks = five.map((m) => strongholdMarks(c, m, 'decisive', T0));
    for (let i = 1; i < 5; i++) expect(marks[i]).toBeGreaterThan(marks[i - 1]);
    expect(strongholdMarks(c, five[0], 'repelled', T0)).toBe(0);
    // Even the last one's bounty is less than its fee.
    const bounties = five.map((m, i) => mercenaryBounty(c.rating, 1e15, SIEGE.STRONGHOLD_PAY[i]));
    for (let i = 1; i < 5; i++) expect(bounties[i]).toBeGreaterThan(bounties[i - 1]);
    for (const [i, m] of five.entries()) expect(bounties[i]).toBeLessThan(mercenaryCosts(c, m, T0).gold);
  });

  it('fall for the day when breached, and may be tried again when they hold', () => {
    let c = castle();
    const [easy] = mercenaries(c, T0, 5);
    const won = assault(c, easy, 0.99);
    expect(won.outcome).not.toBe('repelled');
    c = won.attacker;
    expect(strongholdsFallen(c, T0)).toBe(1);
    expect(siegeRefusal(c, easy.id, false, SIEGE.AP, T0)).toBe('fallen');
    // Tomorrow's strongholds are new: none of them has fallen.
    expect(strongholdsFallen(c, T0 + DAY)).toBe(0);

    // A stronghold that holds may be tried once more that day.
    let d = castle(3);
    const hard = mercenaries(d, T0, 5)[4];
    const lost = assault(d, hard, 0);
    expect(lost.outcome).toBe('repelled');
    d = lost.attacker;
    expect(siegeRefusal(d, hard.id, false, SIEGE.AP, T0)).toBeNull();
    d = assault(d, hard, 0).attacker;
    expect(siegeRefusal(d, hard.id, false, SIEGE.AP, T0)).toBe('pairLimit');
  });

  it('give a rout when all five fall in a day, with its war marks', () => {
    // A castle far stronger than its strongholds (they are drawn from its rating, so it is lowered).
    let c: Castle = { ...castle(30), rating: 2000 };
    const five = mercenaries(c, T0, 5);
    const results = five.map((m) => {
      const r = assault(c, m, 0.99);
      expect(r.outcome).not.toBe('repelled');
      c = r.attacker;
      return r;
    });
    const last = results[4];
    expect(results.slice(0, 4).every((r) => !r.rout)).toBe(true);
    expect(last.rout).toBe(true);
    expect(last.marks).toBe(strongholdMarks(c, five[4], last.outcome, T0) + SIEGE.ROUT_MARKS);
    expect(c.routs).toBe(1);
    expect(strongholdsFallen(c, T0)).toBe(5);
  });

  it('tell each battle how it went: both sides and the fortune of the day', () => {
    const c = castle();
    const r = assault(c, mercenaries(c, T0, 5)[0], 1);
    const a = battleAccount(r.attack, r.defense, r.r);
    expect(a.fortune).toBeCloseTo(COMBAT.ROLL_SPREAD, 3);
    expect(a.attack).toBeGreaterThan(0);
    expect(a.defense).toBeGreaterThan(0);
  });
});

describe('war marks for a siege on a lord', () => {
  it('are more against a stronger lord, up to half again, and less against a far weaker one', () => {
    expect(marksReward(1)).toBe(1);
    expect(marksReward(1.1)).toBeCloseTo(1.21);
    expect(marksReward(1.35)).toBe(SIEGE.BOLD_MARKS_MAX);
    expect(marksReward(0.9)).toBe(1);
    expect(marksReward(0.6)).toBeCloseTo((0.6 / 0.8) ** 2);
    // The fee does not grow with the target: boldness costs only its odds.
    const c = castle();
    expect(siegeCosts(c, 1.3, T0).gold).toBe(siegeCosts(c, 1, T0).gold);
  });
});
