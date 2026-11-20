// How long the supply carried lasts (session 161). A style's supply (whetstones, arrows, runes) adds its
// damage to every fight, one a foe, and "Your odds", XP and gold an hour count it for every fight of the
// hour; with a handful carried it was gone within minutes, the damage with it, and nothing said so. A foe's
// row now says how long the supply lasts there, as it does the food (session 146), when it would not see
// out eight hours.
import { fmt, midSentence, t, XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { combat } from '../src/combat/index.ts';
import { combatData } from '../src/index.ts';
import { oddsFor } from '../src/shared/combat/odds.ts';
import { supplyOf } from '../src/shared/combat/state.ts';

const T0 = Date.UTC(2026, 10, 20, 9);
const fighter = (stones: number): State => ({
  ...newState(3, T0),
  skills: { melee: { xp: XP_TABLE[20] }, hitpoints: { xp: XP_TABLE[20] } },
  items: { 'copper-sword': 1, bread: 5000, 'copper-whetstones': stones },
  features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
});
const facts = (s: State, foe: string) =>
  (combat.slots['combat.foes']({ state: s, now: T0 }) as unknown as { foe: { id: string }; facts: string[] }[]).find(
    (r) => r.foe.id === foe,
  )!.facts;

describe('how long the supply lasts', () => {
  it('says so on the row when the supply would not see out eight hours', () => {
    const s = fighter(20);
    expect(supplyOf(s, 'melee')?.item).toBe('copper-whetstones');
    const perHour = 3600 / oddsFor(s, combatData.foeById('hollow-rat')!)!.secondsPerFight;
    const lasts = t('combat.supplyLasts', {
      supply: midSentence(t('item.copper-whetstones')),
      time: fmt.duration((20 / perHour) * 3_600_000),
    });
    expect(facts(s, 'hollow-rat')).toContain(lasts);
  });

  it('says nothing when there is supply for the day, or none at all', () => {
    const said = (s: State) => facts(s, 'hollow-rat').some((f) => f.includes('last about'));
    expect(said(fighter(100_000))).toBe(false);
    expect(said(fighter(0))).toBe(false);
  });
});
