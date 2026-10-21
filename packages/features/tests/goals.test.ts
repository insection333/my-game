// First steps on the Hearth: each button starts its step, a step is ready once done, and claiming pays
// once; the sword is worn from its step, and the first fight's bread arrives before it.
import { createEngine, newState, seeded, type Command, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import type { Json } from '../src/define.ts';
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
    expect(view(later).rows[0]).toMatchObject({
      state: 'ready',
      button: { label: 'Claim 25 gold', claim: 'chop-a-pine' },
    });
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
    expect(view(first.state)).toMatchObject({ progress: '1 of 6 done' });
    expect(view(first.state).rows[0]).toMatchObject({ state: 'claimed', note: 'Done' });
    expect(done.items).toEqual({});
  });

  it("starts mining in the fire's second lane while chopping, and waits for Smithing 2 to forge", () => {
    const start = (view(newState(1, T0)).rows[0].button as { command: Command }).command;
    const chopping = engine.command(newState(1, T0), T0, start, seeded(1)).state;
    const mine = view(chopping).rows.find((r) => r.id === 'mine-copper-ore')!;
    expect(mine.button).toMatchObject({ label: 'Start mining', command: { lane: 'gathering2' } });
    const forge = view(chopping).rows.find((r) => r.id === 'forge-a-copper-sword')!;
    expect(forge).toMatchObject({ button: null, note: 'Needs Smithing level 2' });
  });

  it('wears the forged sword from its button, and hands over the bread before the first fight', () => {
    const forged = { ...newState(1, T0), items: { 'copper-sword': 1 }, mastery: { 'smithing:copper-sword': 1 } };
    const row = (s: State, id: string) => view(s).rows.find((r) => r.id === id)!;
    expect(row(newState(1, T0), 'wear-your-sword')).toMatchObject({ button: null, note: 'Forge a weapon in Smithing' });
    expect(row(forged, 'defeat-a-hollow-rat')).toMatchObject({
      reward: '10 bread, given first',
      note: 'Wear a weapon first',
    });
    const button = row(forged, 'wear-your-sword').button as { route: { feature: string; route: string; input: Json } };
    expect(button.route).toEqual({ feature: 'combat', route: 'wear', input: { item: 'copper-sword' } });
    const combat = FEATURES.find((f) => f.id === 'combat')!;
    const worn = combat.routes.wear.run(forged, button.route.input, T0).state;
    expect(row(worn, 'wear-your-sword')).toMatchObject({ state: 'ready', button: { claim: 'wear-your-sword' } });
    const claimed = claim(worn, 'wear-your-sword').state;
    expect(claimed.items).toMatchObject({ gold: 25, bread: 10 });
    expect(row(claimed, 'defeat-a-hollow-rat').button).toMatchObject({ label: 'Fight', command: { lane: 'combat' } });
    const won = { ...claimed, mastery: { ...claimed.mastery, 'combat:hollow-rat': 1 } };
    expect(row(won, 'defeat-a-hollow-rat').button).toMatchObject({ label: 'Mark done' });
    expect(claim(won, 'defeat-a-hollow-rat').state.items).toMatchObject({ gold: 25, bread: 10 });
  });

  it('gives way to the goals ladder once every first step is claimed', () => {
    const all = ['chop-a-pine', 'mine-copper-ore', 'smelt-a-copper-bar', 'forge-a-copper-sword', 'wear-your-sword'];
    const s = (claimed: string[]) => ({ ...newState(1, T0), features: { goals: { claimed } } });
    expect(view(s(all))).toMatchObject({ title: 'First steps', progress: '5 of 6 done', refresh: false });
    expect(view(s([...all, 'defeat-a-hollow-rat']))).toMatchObject({ title: 'Goals', progress: null, refresh: true });
  });
});
