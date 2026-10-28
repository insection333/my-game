// An expedition's record in the save (found by the year's simulation, step 18): a long run once
// gathered more finds than the save allows, and the whole of expeditions' save then read as empty,
// taking the player's marks, relics and wins with it. A run now keeps each find once; a run's record
// that is ever damaged costs only that run; a long run's story names a few finds and counts the rest.
import type { State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { rankOf } from '../src/shared/expeditions/relics.ts';
import { expeditionsOf } from '../src/shared/expeditions/state.ts';
import { storyOf } from '../src/shared/expeditions/story.ts';
import { fighterAt, runOnce } from './helpers/expedition.ts';

describe('an expedition record', () => {
  it('keeps each find once over the longest run, and the save stays whole', () => {
    for (const seed of [3, 4]) {
      const { state, home } = runOnce('march', 8, seed);
      const finds = home?.type === 'expeditionDone' ? home.finds : [];
      expect(new Set(finds).size, `seed ${seed}`).toBe(finds.length);
      expect(expeditionsOf(state).marks, `seed ${seed}`).toBeGreaterThan(40);
    }
  });

  it('never takes the marks, relics and wins with a damaged run', () => {
    const base = fighterAt('march');
    const run = {
      region: 'march',
      hours: 8,
      stages: [{ foe: 'hollow-rat', after: null }],
      twists: ['fog'],
      roads: ['high-pass', 'low-road'],
      fork: 0,
      seq: 0,
      road: 'high-pass',
      at: 0,
      marks: 3,
      cleared: 0,
      finds: Array.from({ length: 60 }, () => 'birds-nest'),
    };
    const state: State = {
      ...base,
      features: {
        ...base.features,
        expeditions: {
          marks: 40,
          relics: { hearthstone: 2 },
          drawn: 3,
          run,
          bossDay: {},
          wins: { 'troll-chief': 4 },
          runs: { '8': 2 },
          twists: ['fog'],
        },
      },
    };
    const e = expeditionsOf(state);
    expect(e.marks).toBe(40);
    expect(rankOf(state, 'hearthstone')).toBe(2);
    expect(e.wins['troll-chief']).toBe(4);
    expect(e.run).toBeNull();
  });

  it("tells a long run's finds in a few words", () => {
    const story = storyOf({
      type: 'expeditionDone',
      at: 0,
      region: 'march',
      hours: 8,
      road: 'high-pass',
      boss: 'troll-chief',
      outcome: 'won',
      cleared: 48,
      stages: 48,
      marks: 60,
      finds: ['birds-nest', 'amber-nugget', 'carved-acorn', 'heartwood-knot', 'rough-garnet'],
    });
    expect(story.body).toContain('and 2 more finds');
    expect(story.body.match(/found/g)).toHaveLength(1);
  });
});
