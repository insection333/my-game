// A castle cost the lord cannot pay says how much more is needed, and from where (session 91): the Walls'
// "Raise for 51.5M" stood greyed with 48.8M in the purse, saying nothing of why.
import { castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { shortText } from '../src/pages/castle/synced.ts';

const T0 = Date.UTC(2026, 10, 13, 9);

describe('a cost not met', () => {
  const castle = { ...E.newCastle('a', T0), treasury: 1_000_000 };

  it('says what the purse lacks', () => {
    expect(shortText(castle, 48_800_000, 51_500_000)).toBe('2.7M more gold needed');
  });

  it('says what the treasury lacks when costs come from it', () => {
    expect(shortText({ ...castle, payFromTreasury: true }, 60_000_000, 3_500_000)).toBe(
      '2.5M more needed in the treasury',
    );
  });

  it('says nothing when it can be paid', () => {
    expect(shortText(castle, 60_000_000, 51_500_000)).toBeNull();
    expect(shortText({ ...castle, payFromTreasury: true }, 0, 900_000)).toBeNull();
  });
});
