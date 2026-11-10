// What a sale would take from the lanes (session 71): selling all but one of tin ore while Smithing makes
// bronze bars stopped the lane a moment later, and the question asked first said nothing of it. It now
// says when a running lane uses the item: an artisan's ingredient, the food a fight eats, a style's supply.
import { XP_TABLE } from '@idle-clash/content';
import { createEngine, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES, laneUsing } from '../src/index.ts';

const T0 = Date.UTC(2026, 10, 11, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const base: State = {
  ...newState(4, T0),
  skills: { smithing: { xp: XP_TABLE[10] }, ranged: { xp: XP_TABLE[10] }, hitpoints: { xp: XP_TABLE[10] } },
  items: { 'copper-ore': 50, 'tin-ore': 50, 'bronze-bow': 1, 'copper-arrows': 200, bread: 20, 'pine-logs': 9 },
  features: { combat: { worn: { weapon: 'bronze-bow' }, health: null, healthAt: 0, retreated: null } },
};
const start = (s: State, lane: string, feature: string, id: string) =>
  engine.command(s, T0, { type: 'start', lane, action: { feature, id } } as never, seeded(1)).state;

describe('what a sale would take from the lanes', () => {
  it('names the lane an ingredient feeds, and that it stops', () => {
    const s = start(base, 'artisan', 'smithing', 'bronze-bar');
    expect(s.lanes.artisan.current).not.toBeNull();
    expect(laneUsing(s, 'tin-ore')).toBe('Your Smithing lane uses these, and stops when they run out.');
    expect(laneUsing(s, 'pine-logs')).toBeNull();
    expect(laneUsing(base, 'tin-ore')).toBeNull();
  });

  it("names a fight's food and its supply", () => {
    const s = start(base, 'combat', 'combat', 'goblin-slinger');
    expect(s.lanes.combat.current).not.toBeNull();
    expect(laneUsing(s, 'bread')).toBe('You eat these in your fights.');
    expect(laneUsing(s, 'copper-arrows')).toMatch(/^Your fights use these for [0-9.]+% more damage\.$/);
    expect(laneUsing(base, 'bread')).toBeNull();
  });
});
