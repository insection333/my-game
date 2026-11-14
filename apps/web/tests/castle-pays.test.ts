// What a breach of a lord's castle brings, said with its unit (session 104): "A breach: up to 1.2M and 8–14 war
// marks" left the 1.2M to be guessed, where every other reward the castle states says gold.
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
});
