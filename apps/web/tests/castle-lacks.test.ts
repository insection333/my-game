// What a Halls cost lacks, said under its greyed button (session 126): Study, Forge and Temper are paid in
// gold and war marks, but greyed for want of either they said nothing, where the Army's and the Citadel's
// Raise have said "2.7M more gold needed" since session 91. A forged relic with three already worn said
// nothing of why Wear was greyed.
import { castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { lacks } from '../src/pages/castle/synced.ts';

const T0 = Date.UTC(2026, 10, 17, 9);

describe('a castle cost', () => {
  const castle = { ...E.newCastle('a', T0), warMarks: 20, payFromTreasury: false };

  it('says each thing it lacks, and how much more', () => {
    expect(lacks(castle, 100_000, { gold: 400_000, marks: 50 })).toEqual([
      '300K more gold needed',
      '30 more war marks needed',
    ]);
    expect(lacks(castle, 500_000, { gold: 400_000, marks: 21 })).toEqual(['1 more war mark needed']);
    expect(lacks(castle, 500_000, { gold: 400_000, marks: 20 })).toEqual([]);
  });
});
