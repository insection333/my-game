// What a breach of a lord's castle brings, said with its unit (session 104): "A breach: up to 1.2M and 8–14 war
// marks" left the 1.2M to be guessed, where every other reward the castle states says gold.
// What a stronghold and the fortress pay (session 116): "Taken: 11 war marks" stood beside "Taken 22:48", the
// time one fell, and read as though something had been taken; a reward now says it pays.
import { t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { paysLine, type Target } from '../src/pages/castle/targets.ts';

const T0 = Date.UTC(2026, 10, 14, 9);

describe("a lord's breach", () => {
  it('says the gold it would take is gold', () => {
    const raised = E.newCastle('a', T0);
    const c = { ...raised, rating: E.bastionRating(raised) };
    const lord: Target = {
      id: 'b',
      name: 'Keeper',
      rating: c.rating,
      spyChance: 0.5,
      struck: null,
      shieldedUntil: null,
      merc: null,
    };
    const scouted: E.CastleReport[] = [
      {
        kind: 'spyOut',
        at: T0 - 1000,
        data: { foe: 'b', report: { defense: [50, 30, 20], trap: null, castellan: null, raidable: 1_200_000 } },
      } as unknown as E.CastleReport,
    ];
    expect(paysLine(c, lord, 0, scouted, T0)).toMatch(
      /^A breach: up to [0-9.,]+[KM]? gold and [0-9]+–[0-9]+ war marks$/,
    );
  });

  it('says what a stronghold and the fortress pay', () => {
    const raised = E.newCastle('a', T0);
    const c = { ...raised, rating: E.bastionRating(raised) };
    for (const m of E.mercenaries(c, T0, 5)) {
      const target: Target = {
        id: m.id,
        name: m.id,
        rating: m.rating,
        spyChance: null,
        struck: null,
        shieldedUntil: null,
        merc: m,
      };
      expect(paysLine(c, target, 0, [], T0)).toMatch(/^Pays [0-9,]+ war marks$/);
      expect(paysLine(c, target, 2_000_000, [], T0)).toMatch(
        /^Pays [0-9,]+ war marks( and a bounty of [0-9.,]+[KM]? gold)?$/,
      );
    }
    expect(t('castle.incursion.rewards', { marks: '14' })).toBe('Pays 14 war marks and training');
  });
});
