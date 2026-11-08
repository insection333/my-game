// What food heals, as the pages say it (session 50): the vendor's rows, the item panel's line and
// Cooking's rows say what a food heals in this player's fights, Hitpoints' perks and the Smokehouse
// counted, so "Heals 161" is what the arena shows when it is eaten. They said the food's own healing.
import { fmt, XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { cooking } from '../src/cooking/index.ts';
import { combatData, healsFor } from '../src/index.ts';
import { fight, type Swing } from '../src/shared/combat/fight.ts';
import { fighterOf, mealsOf } from '../src/shared/combat/state.ts';
import { storehouse } from '../src/storehouse/index.ts';

const T0 = Date.UTC(2026, 10, 9, 9);
/** A fighter whose Hitpoints are high enough for Iron stomach (food heals 15% more). */
const fighter = (hitpoints: number): State => ({
  ...newState(5, T0),
  skills: { melee: { xp: XP_TABLE[20] }, hitpoints: { xp: XP_TABLE[hitpoints] }, cooking: { xp: XP_TABLE[30] } },
  items: { 'copper-sword': 1, bread: 50 },
  features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
});
const number = (s: string) => Number(s.replace(/[^0-9]/g, ''));

describe('what food heals', () => {
  it('is what a fight heals when the food is eaten', () => {
    const state = fighter(20);
    expect(healsFor(state, 140)).toBeCloseTo(161);
    const foe = combatData.foeById('cave-troll') ?? combatData.FOES.at(-1)!;
    let draw = 0;
    const eaten: Swing[] = [];
    fight(
      fighterOf(state, foe)!,
      foe,
      () => (draw++ * 0.618) % 1,
      300,
      mealsOf(state),
      {},
      (s) => {
        if (s.by === 'meal') eaten.push(s);
      },
    );
    expect(eaten.length).toBeGreaterThan(0);
    for (const s of eaten) if (s.by === 'meal') expect(s.heals).toBeCloseTo(healsFor(state, 140));
  });

  it("is what the vendor's rows and Cooking's rows say", () => {
    const state = fighter(20);
    const shop = (
      storehouse.slots['combat.food']({ state, now: T0 }) as unknown as { shop: { item: string; facts: string[] }[] }
    ).shop;
    expect(shop.find((f) => f.item === 'bread')!.facts[0]).toBe(`Heals ${fmt.int(healsFor(state, 140))}`);
    expect(number(shop.find((f) => f.item === 'bread')!.facts[0])).toBe(161);
    const rows = cooking.slots['skill.actions']({ state, now: T0 }) as unknown as {
      gives: string;
      heals: string | null;
    }[];
    expect(rows[0].heals).toBe(`Each heals ${fmt.int(healsFor(state, 150))}`);
    expect(rows.every((r) => r.heals !== null)).toBe(true);
    // A newcomer, with no perk, is told the food's own healing.
    expect(healsFor(fighter(1), 140)).toBe(140);
  });
});
