// The lanes as the shell shows them: each says what it is doing, with that action's icon (a fight its
// foe, not the foe's drop), and a stopped lane says why and what puts it right.
import { actionRegistry, FEATURES } from '@idle-clash/features';
import { createEngine, newState, seeded, type Command, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { iconOf, laneViews } from '../src/shell/Lanes.tsx';

const T0 = Date.UTC(2026, 9, 27, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const run = (s: State, c: Command) => engine.command(s, T0, c, seeded(1)).state;

describe('laneViews', () => {
  it('shows a fight by its foe and a gathering action by what it gives', () => {
    let s: State = {
      ...newState(1, T0),
      items: { 'copper-sword': 1 },
      features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
    };
    s = run(s, { type: 'start', lane: 'combat', action: { feature: 'combat', id: 'hollow-rat' } });
    s = run(s, { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } });
    const views = laneViews(s, T0 + 1000, FEATURES);
    expect(views.find((v) => v.id === 'combat')).toMatchObject({ doing: 'Hollow rat', icon: 'hollow-rat' });
    expect(views.find((v) => v.id === 'gathering')).toMatchObject({ doing: 'Pine tree', icon: 'pine-logs' });
  });

  // Session 46: a boss fought in the lane showed its drop (an ingot), not itself.
  it('shows a boss fought in the lane by the boss, and an expedition by what it is', () => {
    expect(iconOf(FEATURES, { feature: 'expeditions', id: 'troll-chief' }, 'combat')).toBe('troll-chief');
    expect(iconOf(FEATURES, { feature: 'combat', id: 'hollow-rat' }, 'combat')).toBe('hollow-rat');
    expect(iconOf(FEATURES, { feature: 'woodcutting', id: 'pine-tree' }, 'gathering')).toBe('pine-logs');
  });

  // Session 89: a lane stopped for want of something, once put right, offers to start that action again
  // (bought food, ore mined), where it went on offering the fix ("Buy food") until the player found the row.
  it('offers to start a stopped action again once the engine would take it', () => {
    let s: State = { ...newState(1, T0), items: { 'copper-ore': 1 } };
    s = run(s, { type: 'start', lane: 'artisan', action: { feature: 'smithing', id: 'copper-bar' } });
    s = engine.advance(s, T0 + 60_000, seeded(1)).state;
    const canStart = (st: State) => (lane: 'artisan', action: { feature: string; id: string }) =>
      engine.command(st, T0 + 60_000, { type: 'start', lane, action }, seeded(1)).result.ok;
    const artisan = (st: State) =>
      laneViews(st, T0 + 60_000, FEATURES, canStart(st) as never).find((v) => v.id === 'artisan')!;
    expect(artisan(s)).toMatchObject({ halted: true, again: undefined });
    expect(artisan(s).fix?.item).toBe('copper-ore');
    const mined = { ...s, items: { ...s.items, 'copper-ore': 4 } };
    expect(artisan(mined)).toMatchObject({
      halted: true,
      again: { label: 'Start again', action: { feature: 'smithing', id: 'copper-bar' } },
      fix: undefined,
    });
  });
});
