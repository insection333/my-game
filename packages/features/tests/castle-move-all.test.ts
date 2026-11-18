// Moving all the gold there is (session 135, the owner's slider beside the typed amount): the treasury
// shrinks by its upkeep second by second, so "all" said as a number the page read a moment before is
// more than the treasury holds by the time it arrives, and was refused. All is now said as all: the
// engine moves what there is when the press lands, the fifth lost on the way as ever.
import { ECONOMY } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { deposit, newCastle, withdraw } from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 18, 9);
const c = { ...newCastle('a', T0), treasury: 4_500_007 };

describe('moving all of it', () => {
  it('withdraws the whole treasury, less the fifth lost on the way', () => {
    const r = withdraw({ castle: c, purse: 10 }, 'all', T0);
    expect(r.ok && r.castle.treasury).toBe(0);
    expect(r.ok && r.purse).toBe(10 + 4_500_007 - Math.ceil(4_500_007 * ECONOMY.WITHDRAW_TAX));
  });

  it('deposits the whole purse, the odd coin too', () => {
    const r = deposit({ castle: c, purse: 1_234_567 }, 'all');
    expect(r.ok && r.purse).toBe(0);
    expect(r.ok && r.castle.treasury).toBe(4_500_007 + 1_234_567);
  });

  it('deposits a purse with a fraction of a coin as its whole coins', () => {
    const r = deposit({ castle: c, purse: 99.6 }, 'all');
    expect(r.ok && r.castle.treasury).toBe(4_500_007 + 99);
    expect(r.ok && r.purse).toBeCloseTo(0.6);
  });

  it('has nothing to move from an empty purse or treasury', () => {
    expect(deposit({ castle: c, purse: 0.4 }, 'all').ok).toBe(false);
    expect(withdraw({ castle: { ...c, treasury: 0 }, purse: 0 }, 'all', T0).ok).toBe(false);
  });

  it('is barred after a scouting as any withdrawal is', () => {
    const scouted = { ...c, withdrawLockdownUntil: T0 + 60_000 };
    expect(withdraw({ castle: scouted, purse: 0 }, 'all', T0)).toEqual({ ok: false, reason: 'locked' });
  });
});
