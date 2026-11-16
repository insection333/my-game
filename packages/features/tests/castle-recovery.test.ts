// How fast walls and wounds mend, said as the engine mends them (session 125): the Army tab said "healing 5
// an hour" (5 what?) and the Citadel "mending 5 an hour" even for a lord wearing Mender's mortar, which
// mends 10% faster a level; the rate is now the engine's, with its unit.
import { fmt, t } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { newCastle, recoveryPerHour, syncRecovery } from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 17, 9);
const H = 3_600_000;

describe('mending', () => {
  it("is 5 points an hour, and more with Mender's mortar worn", () => {
    const plain = { ...newCastle('a', T0), infirmaryPct: 20 };
    expect(recoveryPerHour(plain, T0)).toBe(5);
    const mortar = { ...plain, relics: { 'menders-mortar': 3 }, equippedRelics: ['menders-mortar'] };
    expect(recoveryPerHour(mortar, T0)).toBeCloseTo(6.5);
    // As the engine mends: an hour takes that many points off the wounded.
    expect(20 - syncRecovery(mortar, T0 + H).infirmaryPct).toBeCloseTo(6.5);
  });

  it('is said with its unit', () => {
    expect(t('castle.wounds', { pct: fmt.pct(12), rate: fmt.pct(6.5) })).toBe(
      '12% of your troops wounded, healing 6.5% an hour',
    );
  });
});
