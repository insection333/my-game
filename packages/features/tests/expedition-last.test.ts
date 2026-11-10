// The last run, kept (session 74): a run that came home while the player was on another page, or reading
// the page as it came home, left the Expeditions tab with the next route and no word of how it went; only
// the marks had grown. The run's homecoming is now kept, and the tab tells it until the next run sets out.
import { fmt } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { expeditionStory } from '../src/index.ts';
import { expeditionsOf } from '../src/shared/expeditions/state.ts';
import { nextRoute } from '../src/expeditions/route.ts';
import { setOut } from '../src/expeditions/routes.ts';
import { expeditionView } from '../src/expeditions/views.ts';
import { fighterAt, runOnce } from './helpers/expedition.ts';

describe('the last run', () => {
  it('is told on the tab once it is home, until the next sets out', () => {
    const { state, home } = runOnce('march', 1, 3);
    expect(home).toBeDefined();
    const view = expeditionView(state, home!.at + 60_000);
    const story = expeditionStory(home as Extract<typeof home, { type: 'expeditionDone' }> & object);
    expect(view.last).toEqual({
      title: story.title,
      body: story.body,
      when: fmt.when(home!.at, home!.at + 60_000),
      boss: home!.type === 'expeditionDone' ? home!.boss : '',
    });
    const route = nextRoute(state, 'march', 1)!;
    const out = setOut(state, 'march', 1, route.roads[0]).state;
    expect(expeditionView(out, home!.at).last).toBeNull();
  });

  it('is nothing before the first run, and an old save without it reads', () => {
    expect(expeditionView(fighterAt('march'), 0).last).toBeNull();
    expect(expeditionsOf(fighterAt('march')).last ?? null).toBeNull();
  });
});
