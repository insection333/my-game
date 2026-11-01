// Castle Clash's action points (SPEC.md section 2): AP flows only on a day whose Call to arms was answered;
// days away are credited exactly and lazily; the streak grows to 14 and loses three a missed day; a sync
// never lowers AP, even past the cap.
import { describe, expect, it } from 'vitest';
import {
  apCap,
  claimCallToArms,
  effectiveStreak,
  newCastle,
  pendingReserve,
  syncAp,
  syncCastle,
  type Castle,
} from '../src/shared/castle/index.ts';

const DAY1 = Date.UTC(2026, 10, 2); // Monday 2 November 2026, 00:00 UTC
const H = 3_600_000;
const at = (day: number, hour: number) => DAY1 + (day - 1) * 24 * H + hour * H;

const answered = (c: Castle, t: number): Castle => {
  const r = claimCallToArms(syncAp(c, t), t);
  if (!r.ok) throw new Error('already answered');
  return r.castle;
};

describe('Castle Clash AP', () => {
  it('credits a call answered at 06:00 for the hours since midnight, and 5 AP more', () => {
    const c = answered(newCastle('a', DAY1), at(1, 6));
    // 60 to start, 6 hours × 10 × 1.01 (a streak of 1), and 5.
    expect(c.activeAp).toBeCloseTo(60 + 60.6 + 5, 9);
    expect(c.streakAtLastCta).toBe(1);
    expect(pendingReserve(c, at(1, 7))).toBe(0);
  });

  it('credits days away exactly: the rest of the answered day only, up to the cap, nothing for unanswered days', () => {
    let c = answered(newCastle('a', DAY1), at(1, 6));
    // Away from day 1 at 06:00 to day 4 at noon: the 18 hours left of day 1 fill to the cap (240).
    c = syncAp(c, at(4, 12));
    expect(c.activeAp).toBe(apCap(c, at(4, 12)));
    expect(c.lastApSyncAt).toBe(at(2, 0));
    // Days 2 and 3 were missed: the streak of 1 is gone. Today's reserve waits: 12 hours × 10.
    expect(effectiveStreak(c, at(4, 12))).toBe(0);
    expect(pendingReserve(c, at(4, 12))).toBeCloseTo(120, 9);
    // Answering lifts AP past the cap by up to 25.
    c = answered(c, at(4, 12));
    expect(c.activeAp).toBeCloseTo(240 + 25, 9);
  });

  it('gives the same AP however the time between is split', () => {
    const start = answered(newCastle('a', DAY1), at(1, 3));
    const once = syncAp(start, at(1, 20)).activeAp;
    let split = start;
    for (const h of [5, 9, 9, 14, 19, 20]) split = syncAp(split, at(1, h));
    expect(split.activeAp).toBeCloseTo(once, 9);
    // And a second sync at the same moment changes nothing.
    expect(syncAp(syncAp(start, at(1, 20)), at(1, 20)).activeAp).toBeCloseTo(once, 9);
  });

  it('never lowers AP held past the cap', () => {
    let c = newCastle('a', DAY1);
    c = { ...c, activeAp: 230 };
    c = answered(c, at(1, 10));
    expect(c.activeAp).toBeCloseTo(265, 9);
    expect(syncAp(c, at(1, 23)).activeAp).toBeCloseTo(265, 9);
    expect(syncCastle(c, at(3, 1)).castle.activeAp).toBeCloseTo(265, 9);
  });

  it('grows the streak to 14 at most, refuses a second call in a day, and takes three a missed day', () => {
    let c = newCastle('a', DAY1);
    for (let d = 1; d <= 16; d++) c = answered(c, at(d, 8));
    expect(c.streakAtLastCta).toBe(14);
    expect(claimCallToArms(c, at(16, 22))).toEqual({ ok: false, reason: 'claimed' });
    // Two full days missed (17 and 18): 14 − 6 = 8 on day 19, and the call makes it 9.
    expect(effectiveStreak(c, at(19, 8))).toBe(8);
    expect(answered(c, at(19, 8)).streakAtLastCta).toBe(9);
    // The reserve grows at the streak's rate: 18 hours × 10 × 1.08.
    expect(pendingReserve(c, at(19, 18))).toBeCloseTo(18 * 10 * 1.08, 9);
  });

  it('syncs a whole castle idempotently, however its time away is split', () => {
    let c = answered(newCastle('a', DAY1), at(1, 4));
    c = {
      ...c,
      edict: 'vigor',
      treasury: 5_000_000,
      wallIntegrity: 55,
      infirmaryPct: 30,
      debuffs: [{ kind: 'poison', stacks: 1, until: at(1, 9) }],
      genuineReceived: [at(1, 5)],
    };
    const once = syncCastle(c, at(3, 7));
    expect(syncCastle(once.castle, at(3, 7)).castle).toEqual(once.castle);
    let split = c;
    let burned = 0;
    for (const t of [at(1, 6), at(1, 12), at(2, 1), at(2, 23), at(3, 7)]) {
      const s = syncCastle(split, t);
      split = s.castle;
      burned += s.burned;
    }
    expect(split.activeAp).toBeCloseTo(once.castle.activeAp, 9);
    expect(split.wallIntegrity).toBe(100);
    expect(split.infirmaryPct).toBe(0);
    expect(split.debuffs).toEqual([]);
    expect(split.genuineReceived).toEqual([]);
    // Upkeep floors to whole gold at each sync, so split syncs may burn a few gold more, never less.
    expect(Math.abs(split.treasury - once.castle.treasury)).toBeLessThanOrEqual(5);
    expect(burned + split.treasury).toBe(5_000_000);
  });

  it('starts a new castle with 60 AP, no streak and no AP flowing until the first call', () => {
    const c = newCastle('a', at(1, 5));
    expect(c.activeAp).toBe(60);
    expect(syncAp(c, at(3, 5)).activeAp).toBe(60);
    expect(pendingReserve(c, at(3, 5))).toBeCloseTo(50, 9);
  });
});
