// AP said as the engine gives it (session 127): the Call to arms promised "+30 AP" from today's reserve at
// the old streak, where answering it gives the reserve at the new streak and 5 AP more; and a lord short of
// AP saw greyed buttons with no word of how fast AP comes back. The header now says both from the engine.
import { describe, expect, it } from 'vitest';
import { apCap, apFlow, callGain, claimCallToArms, newCastle } from '../src/shared/castle/index.ts';

const H = 3_600_000;
const day = Date.UTC(2026, 10, 17);

describe('the Call to arms', () => {
  it('promises what answering it gives', () => {
    const c = { ...newCastle('a', day - 5 * 24 * H), activeAp: 40, streakAtLastCta: 6, lastCtaDateUtc: '2026-11-16' };
    const now = day + 9 * H;
    const answered = claimCallToArms(c, now);
    expect(answered.ok && callGain(c, now)).toBe(answered.ok && answered.gained);
  });
});

describe('AP flowing', () => {
  const now = day + 9 * H;
  const answered = {
    ...newCastle('a', day - 5 * 24 * H),
    activeAp: 100,
    streakAtLastCta: 4,
    lastCtaDateUtc: '2026-11-17',
    lastApSyncAt: now,
  };

  it('is said only once the day is answered', () => {
    expect(apFlow({ ...answered, lastCtaDateUtc: '2026-11-16' }, now)).toBeNull();
  });

  it('says its rate, and when the cap is reached if before the day turns', () => {
    const flow = apFlow(answered, now)!;
    expect(flow.perHour).toBeGreaterThan(10);
    expect(flow.fullAt).toBeCloseTo(now + ((apCap(answered, now) - 100) / flow.perHour) * H, -3);
    expect(apFlow({ ...answered, activeAp: 0 }, day + 23 * H)!.fullAt).toBeNull();
    expect(apFlow({ ...answered, activeAp: apCap(answered, now) }, now)!.full).toBe(true);
  });
});
