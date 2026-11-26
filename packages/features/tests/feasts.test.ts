// Session 245: Cooking that matters. The best dish healed 2,290 to the vendor's best food's 2,300, so with gold
// plenty a dish was worth only its XP; dishes now heal 1.3 times their fish, and the top four are made into
// feasts, ten dishes and a greater Uncommon find making ten, a pie's feast lifting damage 5% and a stew's
// combat XP 5% while it is the meal at hand, counted wherever the fight is.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { itemOf } from '../src/shared/catalog.ts';
import { FOES, FOODS } from '../src/shared/combat/data.ts';
import { oddsFor } from '../src/shared/combat/odds.ts';
import { fighterOf, mealsOf } from '../src/shared/combat/state.ts';
import { xpBonusPct, xpParts } from '../src/shared/complete.ts';
import { FEAST_PCT, feastLift, feastWords, mealAtHand } from '../src/shared/feast.ts';
import { RECIPES } from '../src/cooking/content.ts';
import { cooking } from '../src/cooking/index.ts';

const T0 = Date.UTC(2026, 10, 26, 9);
const fighter = (food: Record<string, number>): State => ({
  ...newState(3, T0),
  skills: { melee: { xp: XP_TABLE[90] }, hitpoints: { xp: XP_TABLE[90] }, cooking: { xp: XP_TABLE[90] } },
  items: { 'dawnsteel-sword': 1, ...food },
  features: { combat: { worn: { weapon: 'dawnsteel-sword' }, health: null, healthAt: T0, retreated: null } },
});
const foe = FOES.find((f) => f.id === 'ash-wyvern') ?? FOES.at(-1)!;

describe('dishes and feasts', () => {
  it("heal more than the vendor's best at the top", () => {
    const best = Math.max(...FOODS.map((f) => f.heals));
    expect(itemOf('sturgeon-stew')!.heals).toBe(2_370);
    expect(itemOf('sturgeon-stew')!.heals!).toBeGreaterThan(best);
    expect(itemOf('sturgeon-feast')!.heals).toBe(itemOf('sturgeon-stew')!.heals);
  });

  it('are made ten at a time from ten dishes and a greater find, at the dish’s own level', () => {
    const feast = RECIPES.find((r) => r.id === 'carp-feast')!;
    const pie = RECIPES.find((r) => r.id === 'carp-pie')!;
    expect(feast.takes).toEqual([
      { item: 'carp-pie', count: 10 },
      { item: 'river-pearl', count: 1 },
    ]);
    expect(feast.gives).toEqual([{ item: 'carp-feast', count: 10 }]);
    expect(feast.level).toBe(pie.level);
    expect(RECIPES.filter((r) => r.kind === 'feast').map((r) => r.id)).toEqual([
      'carp-feast',
      'eel-feast',
      'char-feast',
      'sturgeon-feast',
    ]);
  });
});

describe('a feast at hand', () => {
  it('is eaten before a dish that heals as much, and lifts only what it lifts', () => {
    const s = fighter({ 'char-pie': 50, 'char-feast': 20 });
    expect(mealAtHand(s)).toBe('char-feast');
    expect(mealsOf(s).map((m) => m.item)).toEqual(['char-feast', 'char-pie']);
    expect([feastLift(s, 'damage'), feastLift(s, 'xp')]).toEqual([FEAST_PCT, 0]);
  });

  it("lifts a pie's feast's damage in the fighter, and so in Your odds", () => {
    const plain = fighterOf(fighter({ 'char-pie': 50 }), foe)!;
    const fed = fighterOf(fighter({ 'char-pie': 50, 'char-feast': 20 }), foe)!;
    expect(fed.perks.damage - plain.perks.damage).toBe(FEAST_PCT);
    const a = oddsFor(fighter({ 'char-pie': 50 }), foe)!;
    const b = oddsFor(fighter({ 'char-pie': 50, 'char-feast': 20 }), foe)!;
    expect(b.secondsPerFight).toBeLessThan(a.secondsPerFight);
  });

  it("lifts a stew's feast's combat XP, the style's and Hitpoints', never another skill's", () => {
    const s = fighter({ 'sturgeon-feast': 20 });
    expect(xpParts(s, 'melee', [], T0).find((p) => p.source === 'feast')).toEqual({
      source: 'feast',
      pct: FEAST_PCT,
      id: 'sturgeon-feast',
    });
    expect(xpBonusPct(s, 'hitpoints', [], T0, 0, false)).toBe(FEAST_PCT);
    expect(xpParts(s, 'woodcutting', [], T0).some((p) => p.source === 'feast')).toBe(false);
  });

  it('does nothing once a better food is eaten first', () => {
    const s = fighter({ 'carp-feast': 20, 'wardens-feast': 5 });
    expect(mealAtHand(s)).toBe('wardens-feast');
    expect(feastLift(s, 'damage')).toBe(0);
  });

  it('is said on its row and its panel', () => {
    const rows = cooking.slots['skill.actions']({ state: fighter({}), now: T0 }) as unknown as {
      action: { id: string };
      heals: string | null;
    }[];
    const row = rows.find((r) => r.action.id === 'sturgeon-feast')!;
    expect(row.heals).toMatch(/^Each heals [0-9,]+ and lifts combat XP 5% while eaten first$/);
    expect(feastWords('carp-feast')).toBe('While your fighter eats it first: +5% damage.');
  });
});
