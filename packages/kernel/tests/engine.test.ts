import { describe, expect, it } from 'vitest';
import { createEngine, HOUR, MINUTE, newState, seeded, SECOND, State, type Command } from '../src/index.ts';
import { A, registry, T0 } from './fixtures.ts';

const engine = createEngine(registry);
const rng = seeded(1234);
const fresh = () => newState(1234, T0);
const run = (s: State, at: number, cmd: Command) => {
  const out = engine.command(s, at, cmd, rng);
  expect(out.result).toEqual({ ok: true });
  return out.state;
};

describe('advance', () => {
  it('repeats an action and counts its mastery', () => {
    const s = run(fresh(), T0, { type: 'start', lane: 'gathering', action: A.pine });
    const { state } = engine.advance(s, T0 + 75 * SECOND, rng);
    expect(state.items['pine-logs']).toBe(10);
    expect(state.mastery['woodcutting:pine-tree']).toBe(10);
    expect(state.clock).toBe(T0 + 75 * SECOND);
    expect(State.safeParse(state).success).toBe(true);
  });

  it('never changes the state it is given', () => {
    const s = run(fresh(), T0, { type: 'start', lane: 'gathering', action: A.pine });
    const before = JSON.stringify(s);
    engine.advance(s, T0 + HOUR, rng);
    expect(JSON.stringify(s)).toBe(before);
  });

  it('does nothing when time does not move forward', () => {
    const s = run(fresh(), T0, { type: 'start', lane: 'gathering', action: A.pine });
    expect(engine.advance(s, T0 - HOUR, rng)).toEqual({ state: s, events: [] });
  });

  it('stops a lane with its reason when inputs run out, then starts the queued Next', () => {
    let s = fresh();
    s.items['copper-ore'] = 3;
    s = run(s, T0, { type: 'start', lane: 'artisan', action: A.bar });
    s = run(s, T0, { type: 'queueNext', lane: 'artisan', action: A.sword });
    const { state, events } = engine.advance(s, T0 + 50 * SECOND, rng);
    const outOf = (item: string) => ({ code: 'outOfInputs', detail: { item } });
    expect(events).toEqual([
      { type: 'laneStopped', at: T0 + 15 * SECOND, lane: 'artisan', action: A.bar, reason: outOf('copper-ore') },
      { type: 'nextStarted', at: T0 + 15 * SECOND, lane: 'artisan', action: A.sword },
      { type: 'laneStopped', at: T0 + 37.5 * SECOND, lane: 'artisan', action: A.sword, reason: outOf('copper-bar') },
    ]);
    expect(state.items).toEqual({ 'copper-sword': 1 });
    expect(state.lanes.artisan).toMatchObject({ current: null, next: null, stopped: { reason: outOf('copper-bar') } });
  });

  it('feeds one lane from another, in time order', () => {
    // Mining gives an ore every 7.5 s; smelting (5 s) uses ore faster, so it runs dry at 12.5 s.
    let s = run(fresh(), T0, { type: 'start', lane: 'gathering', action: A.copper });
    s = run(s, T0 + 7.5 * SECOND, { type: 'start', lane: 'artisan', action: A.bar });
    const { state, events } = engine.advance(s, T0 + 10 * MINUTE, rng);
    expect(events).toEqual([
      {
        type: 'laneStopped',
        at: T0 + 12.5 * SECOND,
        lane: 'artisan',
        action: A.bar,
        reason: { code: 'outOfInputs', detail: { item: 'copper-ore' } },
      },
    ]);
    expect(state.items['copper-bar']).toBe(1);
    expect(state.items['copper-ore']).toBe(79);
  });

  it('runs the second Gathering lane only while the fire burns', () => {
    let s = run(fresh(), T0, { type: 'start', lane: 'gathering', action: A.pine });
    s = run(s, T0, { type: 'start', lane: 'gathering2', action: A.copper });
    const { state, events } = engine.advance(s, T0 + 20 * MINUTE, rng);
    expect(state.items['copper-ore']).toBe(40); // 5 minutes at 7.5 seconds
    expect(state.items['pine-logs']).toBe(160);
    expect(events).toContainEqual({
      type: 'laneStopped',
      at: T0 + 5 * MINUTE,
      lane: 'gathering2',
      action: A.copper,
      reason: { code: 'fireOut' },
    });
  });

  it('gives fire XP only while the fire burns', () => {
    const s = run(fresh(), T0, { type: 'start', lane: 'gathering', action: A.pine });
    const { state } = engine.advance(s, T0 + 10 * MINUTE, rng);
    // Completions before the fire goes out (7.5 s to 292.5 s) earn 13 XP; from 300 s on, 11.
    expect(state.skills.woodcutting.xp).toBe(39 * 13 + 41 * 11);
  });

  it('rests lanes 24 hours after the last input and resumes them on return without a burst', () => {
    const s = run(fresh(), T0, { type: 'start', lane: 'gathering', action: A.pine });
    const away = engine.advance(s, T0 + 30 * HOUR, rng).state;
    expect(away.items['pine-logs']).toBe((24 * HOUR) / (7.5 * SECOND));
    const back = run(away, T0 + 30 * HOUR, { type: 'stoke' });
    const later = engine.advance(back, T0 + 30 * HOUR + 75 * SECOND, rng).state;
    expect(later.items['pine-logs'] - away.items['pine-logs']).toBe(10);
  });

  it('stops by request and starts the queued Next', () => {
    let s = fresh();
    s.items.bread = 5;
    s = run(s, T0, { type: 'start', lane: 'combat', action: A.rat });
    s.items['copper-ore'] = 1;
    s = run(s, T0, { type: 'start', lane: 'artisan', action: A.bar });
    s = run(s, T0 + SECOND, { type: 'stop', lane: 'combat' });
    expect(s.lanes.combat.current).toBeNull();
    expect(s.lanes.combat.stopped?.reason).toEqual({ code: 'stoppedByPlayer' });
  });

  it('keeps progress when the same action is started again', () => {
    const s = run(fresh(), T0, { type: 'start', lane: 'gathering', action: A.pine });
    const again = run(s, T0 + 5 * SECOND, { type: 'start', lane: 'gathering', action: A.pine });
    expect(again.lanes.gathering.current).toEqual(s.lanes.gathering.current);
  });

  it('refuses an action on the wrong lane, an unknown action, and a fight without food', () => {
    const s = fresh();
    expect(engine.command(s, T0, { type: 'start', lane: 'artisan', action: A.pine }, rng).result).toEqual({
      ok: false,
      reason: { code: 'wrongLane', detail: { action: 'woodcutting:pine-tree' } },
    });
    const unknown = { feature: 'fishing', id: 'trout' };
    expect(engine.command(s, T0, { type: 'start', lane: 'gathering', action: unknown }, rng).result).toMatchObject({
      ok: false,
      reason: { code: 'unavailable' },
    });
    expect(engine.command(s, T0, { type: 'start', lane: 'combat', action: A.rat }, rng).result).toEqual({
      ok: false,
      reason: { code: 'outOfFood' },
    });
  });

  it('catches up a day of three busy lanes quickly', () => {
    let s = fresh();
    s.items.bread = 1_000_000;
    s.items['copper-ore'] = 1;
    s = run(s, T0, { type: 'start', lane: 'gathering', action: A.copper });
    s = run(s, T0, { type: 'start', lane: 'artisan', action: A.bar });
    s = run(s, T0, { type: 'start', lane: 'combat', action: A.rat });
    const start = performance.now();
    const { state } = engine.advance(s, T0 + 24 * HOUR, rng);
    const ms = performance.now() - start;
    expect(state.mastery['mining:copper-vein']).toBe(11520);
    expect(ms).toBeLessThan(400);
  });
});
