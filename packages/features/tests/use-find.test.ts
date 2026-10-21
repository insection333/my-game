// A Rare find can be spent on one action of its skill for 500 mastery completions; not on another
// skill's action, not when it is not held, and an Uncommon or Legendary find cannot be.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionsFor, FEATURES } from '../src/index.ts';

const T0 = Date.UTC(2026, 9, 21, 9);
const store = FEATURES.find((f) => f.id === 'storehouse')!;
const use = (s: State, item: string, action: { feature: string; id: string }) =>
  store.routes.useFind.run(s, { item, action }, T0) as {
    state: State;
    result: { ok: boolean; reason?: { code: string } };
    events?: { type: string; step?: number }[];
  };
const player: State = {
  ...newState(5, T0),
  skills: { woodcutting: { xp: XP_TABLE[12] }, melee: { xp: XP_TABLE[8] }, hitpoints: { xp: XP_TABLE[5] } },
  items: { 'carved-acorn': 2, 'birds-nest': 1, 'torn-banner': 1 },
  mastery: { 'woodcutting:ash-tree': 100 },
};

describe('using a Rare find', () => {
  it('adds 500 mastery completions to an action of its skill, with the steps it reaches', () => {
    const r = use(player, 'carved-acorn', { feature: 'woodcutting', id: 'ash-tree' });
    expect(r.result).toEqual({ ok: true });
    expect(r.state.mastery['woodcutting:ash-tree']).toBe(600);
    expect(r.state.items['carved-acorn']).toBe(1);
    expect(r.events?.map((e) => e.step)).toEqual([3, 4]);
  });

  it("goes to a foe for a combat style's find, and nowhere it does not belong", () => {
    expect(actionsFor(player, 'torn-banner').map((a) => a.id)).toContain('hollow-rat');
    expect(use(player, 'torn-banner', { feature: 'combat', id: 'hollow-rat' }).result).toEqual({ ok: true });
    expect(use(player, 'carved-acorn', { feature: 'mining', id: 'copper-vein' }).result).toMatchObject({
      reason: { code: 'notItsAction' },
    });
    expect(use(player, 'carved-acorn', { feature: 'woodcutting', id: 'yew-tree' }).result).toMatchObject({
      reason: { code: 'notItsAction' },
    });
    expect(use(player, 'birds-nest', { feature: 'woodcutting', id: 'ash-tree' }).result).toMatchObject({
      reason: { code: 'notARareFind' },
    });
    expect(
      use({ ...player, items: {} }, 'carved-acorn', { feature: 'woodcutting', id: 'ash-tree' }).result,
    ).toMatchObject({
      reason: { code: 'notOwned' },
    });
  });
});
