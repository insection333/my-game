// Levelling a troop or a building up several at once (session 134, the owner: "Level up +1 or +5"): the
// price is the sum of each level's, to the coin, as five presses would pay; never past the top; refused
// whole when it cannot all be paid.
import { ECONOMY } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { levelUpCost, newCastle, upgrade } from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 18, 9);
const c0 = { ...newCastle('a', T0), levels: { ...newCastle('a', T0).levels, vanguard: 21, walls: 97 } };

describe('levelling up several at once', () => {
  it('costs what that many single levels cost, and raises that many', () => {
    let w = { castle: c0, purse: 1e15 };
    for (let i = 0; i < 5; i++) {
      const r = upgrade(w, 'vanguard', T0);
      if (!r.ok) throw new Error(r.reason);
      w = { castle: r.castle, purse: r.purse };
    }
    const five = upgrade({ castle: c0, purse: 1e15 }, 'vanguard', T0, 5);
    expect(five.ok && five.castle.levels.vanguard).toBe(26);
    expect(five.ok && five.purse).toBe(w.purse);
    expect(levelUpCost(c0, 'vanguard', 5, T0)).toBe(1e15 - w.purse);
  });

  it('never goes past the top', () => {
    expect(upgrade({ castle: c0, purse: 1e15 }, 'walls', T0, 5)).toEqual({ ok: false, reason: 'top' });
    const three = upgrade({ castle: c0, purse: 1e15 }, 'walls', T0, ECONOMY.MAX_LEVEL - 97);
    expect(three.ok && three.castle.levels.walls).toBe(ECONOMY.MAX_LEVEL);
  });

  it('is refused whole when it cannot all be paid', () => {
    const short = levelUpCost(c0, 'vanguard', 5, T0) - 1;
    expect(upgrade({ castle: c0, purse: short }, 'vanguard', T0, 5)).toEqual({ ok: false, reason: 'gold' });
  });

  it('refuses a count that is not 1 to 5', () => {
    for (const bad of [0, 6, 2.5, -1])
      expect(upgrade({ castle: c0, purse: 1e15 }, 'vanguard', T0, bad)).toEqual({ ok: false, reason: 'invalid' });
  });
});
