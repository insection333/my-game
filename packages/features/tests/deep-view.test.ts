// The Deep on the page (session 213): nothing below Hitpoints 99; at 99, where the descent starts, the pack
// it carries, how deep that pack should go (Your odds, depth by depth), the next boss and the week's omens
// as they hold in the Deep; under way, the depth, the meals left and the marks.
import { MINUTE, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { deepView, reachOf } from '../src/expeditions/deep-view.ts';
import { deepOf, descend } from '../src/expeditions/deep.ts';
import { engine, fighterOfLevel, T0 } from './helpers/expedition.ts';

const DEEP = { feature: 'expeditions', id: 'deep' };
const go = (s: State, until: number, seed = 3) => {
  const begun = engine.command(descend(s).state, T0, { type: 'start', lane: 'combat', action: DEEP }, seeded(seed));
  return engine.advance(begun.state, until, seeded(seed));
};

describe('the Deep on the page', () => {
  it('says nothing below Hitpoints 99', () => {
    expect(deepView(fighterOfLevel(95, 1, 'melee'), T0)).toBeNull();
  });

  it('at 99, starts from the surface with a pack of thirty of the best food, and names the first boss', () => {
    const v = deepView(fighterOfLevel(99, 1, 'melee'), T0)!;
    expect(v.deepest).toBeNull();
    expect(v.from).toBe('From the surface');
    expect(v.pack).toMatch(/^A pack of 30 meals: .+ ×30$/);
    expect(v.boss).toMatchObject({ id: 'barrow-king', depth: 'At depth 10' });
    expect(v.omens).toHaveLength(2);
    for (const o of v.omens) expect(o.text).not.toMatch(/cache|camp|stage/i);
  });

  it('says how deep the pack should go, near where a descent ends', () => {
    for (const style of ['melee', 'archery', 'magic'] as const)
      for (const seed of [1, 2, 3]) {
        const s = fighterOfLevel(99, seed, style);
        const said = reachOf(s, 0, 0, 0, T0);
        const out = go(s, T0 + 12 * 60 * MINUTE, seed);
        const done = out.events.find((e) => e.type === 'deepDone')!;
        expect(Math.abs(said.depth - done.depth), `${style} ${seed}`).toBeLessThanOrEqual(6);
      }
  });

  it('under way, says the depth, the meals left and the marks; after, the deepest and the waystone', () => {
    const s = fighterOfLevel(99, 1, 'melee');
    const under = deepView(go(s, T0 + 30 * MINUTE).state, T0 + 30 * MINUTE)!;
    expect(under.run).toMatchObject({ depth: 'Depth 4', running: true, progress: 0.3 });
    expect(under.run!.meals).toMatch(/^\d+ of 30 meals left$/);
    const after = go(s, T0 + 12 * 60 * MINUTE).state;
    const v = deepView(after, T0 + 12 * 60 * MINUTE)!;
    expect(v.run).toBeNull();
    expect(v.deepest).toBe(`Deepest: depth ${deepOf(after).deepest}`);
    expect(v.from).toBe('From depth 10, your deepest waystone');
  });
});
