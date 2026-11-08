// What gear says it does (session 51): a weapon "+30 max hit", armour "7.5% less damage taken", on the
// gear choices and the item panel; the very numbers a fight swings with. Gear said nothing before.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { combat } from '../src/combat/index.ts';
import { combatData, gearDoes } from '../src/index.ts';
import { fight, type Fighter, type Swing } from '../src/shared/combat/fight.ts';
import { fighterOf } from '../src/shared/combat/state.ts';

const T0 = Date.UTC(2026, 10, 9, 9);
const state: State = {
  ...newState(5, T0),
  skills: { melee: { xp: XP_TABLE[1] }, hitpoints: { xp: XP_TABLE[30] } },
  items: { 'copper-sword': 1, 'iron-sword': 1, 'steel-helm': 1, 'steel-body': 1 },
  features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
};
const number = (s: string) => Number(s.replace(/[^0-9.]/g, ''));
/** A melee foe, so the triangle is even and a swing hits for what it rolls. */
const foe = combatData.FOES.find((f) => f.style === 'melee')!;
/** The first swing each side lands, with draws that hit and roll as given. */
function firstHits(p: Fighter, roll: number) {
  const draws = [0, roll, 0, roll];
  let i = 0;
  const hits: Swing[] = [];
  fight(
    p,
    foe,
    () => draws[i++ % 4],
    10_000,
    [],
    {},
    (s) => void hits.push(s),
  );
  const you = hits.find((s) => s.by === 'you')!;
  const them = hits.find((s) => s.by === 'foe')!;
  return { you: you.by === 'meal' ? 0 : you.damage, them: them.by === 'meal' ? 0 : them.damage };
}

describe('what gear says it does', () => {
  it("is a weapon's tier on the most a swing can roll", () => {
    const p = fighterOf(state, foe)!;
    const said = number(gearDoes('iron-sword')!);
    expect(gearDoes('iron-sword')).toBe(`+${said} max hit`);
    const tier = 3; // iron
    const top = (t: number) => firstHits({ ...p, weaponTier: t }, 0.999_999).you;
    expect(top(tier) - top(0)).toBe(said);
  });

  it("is armour's tier off every hit taken", () => {
    const p = fighterOf(state, foe)!;
    expect(gearDoes('steel-helm')).toMatch(/^[0-9.]+% less damage taken$/);
    const pct = number(gearDoes('steel-helm')!);
    const steel = 4;
    const taken = (armour: number) => firstHits({ ...p, armour }, 0.5).them;
    expect(taken(steel) / taken(0)).toBeCloseTo(1 - pct / 100);
  });

  it('is said on each gear choice', () => {
    const view = combat.slots['combat.loadout']({ state, now: T0 }) as unknown as {
      slots: { slot: string; choices: { item: string; does: string }[] }[];
    };
    const choices = view.slots.flatMap((g) => g.choices);
    expect(choices.find((c) => c.item === 'iron-sword')?.does).toBe(gearDoes('iron-sword'));
    expect(choices.find((c) => c.item === 'steel-body')?.does).toBe(gearDoes('steel-body'));
    expect(gearDoes('bread')).toBeNull();
  });
});
