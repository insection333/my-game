// Session 149: a lane that ran dry and then woke as another lane brought its ingredient in kept working, so
// the recap does not say it stopped, whether it runs or waits for the next when the player is back; a lane
// that ran dry with nothing coming does.
import { describe, expect, it } from 'vitest';
import { createEngine, newState, seeded, summarizeAway, type Command, type State } from '../src/index.ts';
import { A, registry, T0 } from './fixtures.ts';

const engine = createEngine(registry);
const rng = seeded(1234);
const MINUTE = 60_000;
const run = (s: State, at: number, cmd: Command) => engine.command(s, at, cmd, rng).state;

describe('the away summary of a lane that waited', () => {
  it('leaves out a stop the lane woke from, and keeps one with nothing coming', () => {
    let s = run(newState(1234, T0), T0, { type: 'start', lane: 'gathering', action: A.copper });
    s = run(s, T0 + 7_500, { type: 'start', lane: 'artisan', action: A.bar });
    const at = T0 + 10 * MINUTE + 1_000; // mid-smelt
    const { state, events } = engine.advance(s, at, rng);
    expect(state.lanes.artisan.current?.waited).toBe(true);
    expect(summarizeAway(s, state, events, at).events.filter((e) => e.type === 'laneStopped')).toEqual([]);
    const dry = T0 + 10 * MINUTE + 6_000; // smelted, the next ore not yet in: waiting, having worked
    const later = engine.advance(s, dry, rng);
    expect(later.state.lanes.artisan.current).toBeNull();
    expect(summarizeAway(s, later.state, later.events, dry).events.filter((e) => e.type === 'laneStopped')).toEqual([]);
    // Nothing coming: the stop is the news.
    let alone = run(newState(1234, T0), T0, { type: 'start', lane: 'gathering', action: A.pine });
    alone.items['copper-ore'] = 1;
    alone = run(alone, T0, { type: 'start', lane: 'artisan', action: A.bar });
    const end = engine.advance(alone, T0 + 10 * MINUTE, rng);
    expect(summarizeAway(alone, end.state, end.events, T0 + 10 * MINUTE).events.map((e) => e.type)).toContain(
      'laneStopped',
    );
  });
});
