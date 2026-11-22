// Castle Clash sooner, and priced for a young purse (session 167). The page opened at total level 100, about
// two days of play for a newcomer, and once open a level-1 castle (rating 540) met a 27,000-gold stronghold,
// 27,000 to 40,500 for a spy and 354,000 to 590,000 for its first level, against a newcomer's 5,000 gold an
// hour. It opens at total level 30 (about twenty minutes in); a young castle's fee, bribe and bounty scale by
// its rating up to 2,400, the bounty staying under the fee; and its first levels come cheaper, up to full
// price at level 4.
import { SIEGE, SPY_MISSIONS, UNITS } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import {
  castleOpen,
  levelUpCost,
  mercenaries,
  mercenaryBounty,
  mercenaryCosts,
  newCastle,
  siegeCosts,
  spyCosts,
  syncCastle,
  type Castle,
} from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 22, 9);
const at = (level: number): Castle => {
  const c = newCastle('a', T0);
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as Castle['levels'];
  return syncCastle({ ...c, levels }, T0).castle;
};

describe('Castle Clash for a new player', () => {
  it('opens at total level 30', () => {
    expect(castleOpen(29)).toBe(false);
    expect(castleOpen(30)).toBe(true);
  });

  it("prices a level-1 castle's war at its share of the fee", () => {
    const c = at(1);
    expect(c.rating).toBe(540);
    expect(siegeCosts(c, 1, T0).gold).toBe(6075);
    expect(mercenaryCosts(c, mercenaries(c, T0, 1)[0], T0).gold).toBe(6075);
    const scout = SPY_MISSIONS.find((m) => m.id === 'scout')!;
    expect(spyCosts(c, c, scout, T0).gold).toBe(6075);
  });

  it("keeps every stronghold's bounty under its fee at every level", () => {
    for (const level of [1, 2, 3, 4, 6, 10]) {
      const c = at(level);
      const fee = siegeCosts(c, 1, T0).gold;
      for (const pay of SIEGE.STRONGHOLD_PAY) expect(mercenaryBounty(c.rating, 1e12, pay)).toBeLessThan(fee);
    }
  });

  it('charges a grown castle what it always has', () => {
    const c = at(6);
    expect(siegeCosts(c, 1, T0).gold).toBe(Math.round(SIEGE.MOBILIZE_PER_RATING * c.rating));
  });

  it('brings the first levels cheaper, at full price from level 4', () => {
    const base = UNITS.find((u) => u.id === 'vanguard')!.cost;
    expect(levelUpCost(at(1), 'vanguard', 1, T0)).toBe(Math.round((base * 1.18) / 16));
    expect(levelUpCost(at(2), 'vanguard', 1, T0)).toBe(Math.round((base * 1.18 ** 2) / 4));
    expect(levelUpCost(at(4), 'vanguard', 1, T0)).toBe(Math.round(base * 1.18 ** 4));
  });
});
