// The gains feed's source: what a lane brought in between two ticks of the page's clock, from the
// real engine. Items that rose and XP earned count; what a recipe used up does not.
import { actionRegistry, FEATURES } from '@idle-clash/features';
import { createEngine, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { gainsBetween } from '../src/game/gains.ts';

const T = Date.UTC(2026, 9, 22, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const at = (s: State, ms: number) => engine.advance(s, T + ms, seeded(s.seed)).state;

describe('gains', () => {
  it('counts the logs and the XP a chop brings, and nothing before it lands', () => {
    const chopping = engine.command(
      newState(3, T),
      T,
      { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } },
      seeded(3),
    ).state;
    expect(gainsBetween(chopping, at(chopping, 3_000))).toEqual([]);
    const gains = gainsBetween(at(chopping, 7_000), at(chopping, 8_000));
    expect(gains.map((g) => (g.kind === 'item' ? [g.item, g.count] : [g.skill, g.xp > 0]))).toEqual([
      ['pine-logs', 1],
      ['woodcutting', true],
    ]);
  });

  it('leaves out what was used up and XP too small to show', () => {
    const before = { ...newState(3, T), items: { 'copper-ore': 5, 'tin-ore': 5 }, skills: { smithing: { xp: 10 } } };
    const after = {
      ...before,
      items: { 'copper-ore': 4, 'tin-ore': 4, 'bronze-bar': 1 },
      skills: { smithing: { xp: 10.2 } },
    };
    expect(gainsBetween(before, after)).toEqual([{ kind: 'item', item: 'bronze-bar', count: 1 }]);
  });
});
