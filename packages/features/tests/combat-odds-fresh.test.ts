// Your odds kept fresh (session 48): the odds were remembered by a fighter's levels, gear and food alone,
// so a whetstone carried (a supply's damage), the Training yard raised (damage) or the Smokehouse (food
// heals more) left the odds, and every rate the Combat page states from them, as they were.
import { XP_TABLE } from '@idle-clash/content';
import { createEngine, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { arenaOf } from '../src/combat/arena.ts';
import { actionRegistry, combatData, FEATURES } from '../src/index.ts';
import { oddsFor } from '../src/shared/combat/odds.ts';

const T0 = Date.UTC(2026, 10, 9, 9);
const fighter = (items: Record<string, number>): State => ({
  ...newState(3, T0),
  skills: { melee: { xp: XP_TABLE[20] }, hitpoints: { xp: XP_TABLE[20] } },
  items: { 'copper-sword': 1, bread: 20, ...items },
  features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
});

describe('Your odds', () => {
  it('change when a supply is carried', () => {
    const foe = combatData.foeById('orc-raider')!;
    const without = oddsFor(fighter({}), foe)!;
    const whet = oddsFor(fighter({ 'copper-whetstones': 50 }), foe)!;
    expect(whet.secondsPerFight).toBeLessThan(without.secondsPerFight);
  });
});

describe('the arena', () => {
  it('plays the fight again when the food or supply it will be settled with changes', () => {
    const engine = createEngine(actionRegistry(FEATURES, () => true));
    const start = { type: 'start', lane: 'combat', action: { feature: 'combat', id: 'orc-raider' } } as const;
    const s = engine.command(fighter({}), T0, start, seeded(2)).state;
    const before = arenaOf(s)!;
    const carried = { ...s, items: { ...s.items, 'copper-whetstones': 50 } };
    const after = arenaOf(carried)!;
    expect(after).not.toBe(before);
    // The same draws, each hit harder by the whetstone's damage.
    const firstHit = (a: typeof before) => {
      const x = a.swings.find((y) => y.by === 'you' && y.hit);
      return x && x.by !== 'meal' ? x.damage : 0;
    };
    expect(firstHit(after)).toBeGreaterThan(firstHit(before));
  });
});
