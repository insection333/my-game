// The first step on the Hearth: its button starts it, it is ready once done, and claiming pays once.
import { createEngine, newState, seeded, type Command, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { goals, type GoalsView } from '../src/goals/index.ts';
import { actionRegistry, FEATURES } from '../src/index.ts';

const T0 = Date.UTC(2026, 9, 20, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const view = (state: State) => goals.slots['hearth.goals']({ state, now: state.clock }) as unknown as GoalsView;
const claim = (state: State, goal = 'chop-a-pine') => goals.routes.claim.run(state, { goal }, state.clock);

describe('first steps', () => {
  it('offers a newcomer a button that starts chopping', () => {
    const [row] = view(newState(1, T0)).rows;
    expect(row).toMatchObject({ name: 'Chop a pine', reward: '25 gold', state: 'todo' });
    expect(row.button).toEqual({
      label: 'Start chopping',
      command: { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } },
    });
  });

  it('shows the step at work, then ready to claim after the first pine', () => {
    const start = (view(newState(1, T0)).rows[0].button as { command: Command }).command;
    const s = engine.command(newState(1, T0), T0, start, seeded(1)).state;
    expect(view(s).rows[0]).toMatchObject({ state: 'working', note: 'Working in your Gathering lane', button: null });
    const later = engine.advance(s, T0 + 8000, seeded(1)).state;
    expect(view(later).rows[0]).toMatchObject({ state: 'ready', button: { label: 'Claim 25 gold', claim: 'chop-a-pine' } });
  });

  it('pays its reward once, with a moment, and refuses a claim before the step is done', () => {
    expect(claim(newState(1, T0)).result).toEqual({ ok: false, reason: 'notDone' });
    const done = { ...newState(1, T0), mastery: { 'woodcutting:pine-tree': 1 } };
    const first = claim(done);
    expect(first.result).toEqual({ ok: true });
    expect(first.events).toEqual([{ type: 'goalDone', at: T0, goal: 'chop-a-pine' }]);
    expect(first.state.items.gold).toBe(25);
    expect(first.state.luck.lastMoment).toBe(T0);
    const again = claim(first.state);
    expect(again.state.items.gold).toBe(25);
    expect(again.events).toEqual([]);
    expect(view(first.state)).toMatchObject({ progress: '1 of 1 done', rows: [{ state: 'claimed', note: 'Done' }] });
    expect(done.items).toEqual({});
  });
});
