// Session 268: a foe's row says what the lane nets in gold an hour, food's and supplies' worth taken off, so a
// fighter whose whetstones cost more than a hollow rat pays read "-1,000 gold an hour". It says so in words.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { combat } from '../src/combat/index.ts';
import '../src/index.ts';

const T0 = Date.UTC(2026, 10, 20, 9);
const fighter = (stones: number): State => ({
  ...newState(3, T0),
  skills: { melee: { xp: XP_TABLE[99] }, hitpoints: { xp: XP_TABLE[99] } },
  items: { 'copper-sword': 1, 'dawnsteel-whetstones': stones },
  features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
});
const facts = (s: State) =>
  (combat.slots['combat.foes']({ state: s, now: T0 }) as unknown as { foe: { id: string }; facts: string[] }[]).find(
    (r) => r.foe.id === 'hollow-rat',
  )!.facts;

describe('a fight that costs more than it pays', () => {
  it('says so in words, never a negative number', () => {
    const lost = facts(fighter(100_000));
    expect(lost.some((f) => /^Food and supplies cost [0-9,]+ gold an hour more than this pays$/.test(f))).toBe(true);
    expect(lost.some((f) => /-\d/.test(f))).toBe(false);
    expect(facts(fighter(0)).some((f) => /^[0-9,]+ gold an hour$/.test(f))).toBe(true);
  });
});
