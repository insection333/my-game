// The fork's roads, said (session 103): a road is gone by, not taken like a thing, where its button read
// "Take the old shrine" and "Take the warden's gate", and the run's story "Took the old shrine".
import { newState } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { routeView } from '../src/expeditions/views.ts';
import '../src/index.ts';
import { ROADS } from '../src/shared/expeditions/data.ts';
import { storyOf } from '../src/shared/expeditions/story.ts';

describe('a road at the fork', () => {
  it('is gone by, on its button and in the story of the run', () => {
    const route = routeView(newState(3, 0), 'march', 1)!;
    for (const road of route.roads) expect(road.label).toMatch(/^Go by the /);
    for (const road of ROADS) {
      const { body } = storyOf({
        type: 'expeditionDone',
        at: 0,
        region: 'fen',
        hours: 1,
        boss: 'drowned-warden',
        outcome: 'won',
        road: road.id,
        stages: 6,
        cleared: 6,
        marks: 4,
        finds: [],
      });
      expect(body).toMatch(/^Went by the /);
    }
  });
});
