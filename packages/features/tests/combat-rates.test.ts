// What the Combat page states a foe pays (session 47): the XP an hour counts every gain the engine pays
// on the style's XP (here the fire's heat), as the skill pages' rows do; without one, it is the odds' own.
import { fireXpPct, XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { combat } from '../src/combat/index.ts';
import { combatData } from '../src/index.ts';
import { oddsFor } from '../src/shared/combat/odds.ts';

const T0 = Date.UTC(2026, 10, 9, 9);
const fighter = (fire: boolean): State => ({
  ...newState(3, T0),
  ...(fire ? { fireUntil: T0 + 600_000, fireSince: T0 } : { fireUntil: 0, fireSince: undefined }),
  skills: { melee: { xp: XP_TABLE[20] }, hitpoints: { xp: XP_TABLE[20] } },
  items: { 'copper-sword': 1, bread: 20 },
  features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
});
const stated = (s: State) => {
  const rows = combat.slots['combat.foes']({ state: s, now: T0 }) as unknown as {
    foe: { id: string };
    facts: string[];
  }[];
  return Number(rows.find((r) => r.foe.id === 'hollow-rat')!.facts[0].replace(/[^0-9]/g, ''));
};

describe("a foe's XP an hour", () => {
  it('counts the fire, as the lane pays it', () => {
    const base = oddsFor(fighter(false), combatData.foeById('hollow-rat')!)!.xpPerHour;
    expect(stated(fighter(false))).toBe(Math.round(base));
    expect(stated(fighter(true))).toBe(Math.round(base * (1 + fireXpPct(0) / 100)));
  });
});
