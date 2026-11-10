// A stronghold out of reach (session 75): a new lord's day held the Iron Banner at "0% to win" with its
// Siege button open, and a siege no roll can win pays nothing and wounds the troops (27,000 gold and 20 AP
// for certain loss). A stronghold's or the fortress's chance is exact, so at nought its button is closed
// and the row says why; a lord's is an estimate, so it stays open.
import { castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { outOfReach, type Target } from '../src/pages/castle/targets.ts';

const T0 = Date.UTC(2026, 10, 11, 9);

describe('a stronghold out of reach', () => {
  it('is one no roll takes, and its siege is closed', () => {
    // A castle just raised, rated as the server rates it.
    const raised = E.newCastle('a', T0);
    const c = { ...raised, rating: E.bastionRating(raised) };
    // A month of days' strongholds, against a castle just raised.
    const days = Array.from({ length: 30 }, (_, i) => T0 + i * 86_400_000);
    const hopeless = days.flatMap((now) =>
      E.mercenaries(c, now, 5)
        .filter((m) => E.winChance(E.bestOffense(c, E.mercenarySide(m), now).r) === 0)
        .map((m) => ({ m, now })),
    );
    expect(hopeless.length).toBeGreaterThan(0);
    for (const { m, now } of hopeless) {
      const best = E.bestOffense(c, E.mercenarySide(m), now);
      // The kindest roll there is still repels it.
      expect(E.resolveMercenary({ ...c, offense: best.shares }, m, now, 1, 0).outcome).toBe('repelled');
      const target: Target = {
        id: m.id,
        name: m.id,
        rating: m.rating,
        spyChance: null,
        struck: null,
        shieldedUntil: null,
        merc: m,
      };
      expect(outOfReach(target, 0)).toBe(true);
      expect(outOfReach(target, 0.004)).toBe(false);
    }
  });

  it("leaves a lord's estimate open", () => {
    const lord: Target = {
      id: 'l',
      name: 'Keeper',
      rating: 900,
      spyChance: null,
      struck: null,
      shieldedUntil: null,
      merc: null,
    };
    expect(outOfReach(lord, 0)).toBe(false);
  });
});
