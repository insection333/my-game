// How long the food carried lasts (session 146). A player three weeks in fought an orc raider at 8 food an
// hour with a single bread carried: the lane stopped "Out of food" within minutes, and nothing on the page
// said so before they walked away. A foe's row now says how long the food lasts there, when it would not
// see out the eight hours a player is most often away.
import { fmt, t, XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { combat } from '../src/combat/index.ts';
import { combatData } from '../src/index.ts';
import { oddsFor } from '../src/shared/combat/odds.ts';

const T0 = Date.UTC(2026, 10, 19, 9);
const fighter = (bread: number): State => ({
  ...newState(3, T0),
  skills: { melee: { xp: XP_TABLE[20] }, hitpoints: { xp: XP_TABLE[20] } },
  items: { 'copper-sword': 1, bread },
  features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
});
const facts = (s: State, foe: string) =>
  (combat.slots['combat.foes']({ state: s, now: T0 }) as unknown as { foe: { id: string }; facts: string[] }[]).find(
    (r) => r.foe.id === foe,
  )!.facts;

describe('how long the food lasts', () => {
  // A foe that eats food at this fighter's level.
  const foe = ['orc-raider', 'orc-bowman', 'hollow-rat'].find(
    (id) => (oddsFor(fighter(1), combatData.foeById(id)!)?.foodPerHour ?? 0) > 2,
  )!;

  it('says so on the row when the food would not see out eight hours', () => {
    const perHour = oddsFor(fighter(1), combatData.foeById(foe)!)!.foodPerHour;
    const lasts = t('combat.foodLasts', { time: fmt.duration((1 / perHour) * 3_600_000) });
    expect(facts(fighter(1), foe)).toContain(lasts);
  });

  it('says nothing when there is food for the day', () => {
    const lead = t('combat.foodLasts', { time: '|' }).split('|')[0];
    expect(facts(fighter(500), foe).some((f) => f.startsWith(lead))).toBe(false);
  });
});
