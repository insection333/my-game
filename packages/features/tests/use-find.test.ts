// A Rare find can be spent on one action of its skill for 500 mastery completions; not on another
// skill's action, not when it is not held, and an Uncommon or Legendary find cannot be.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionsFor, FEATURES, findUses } from '../src/index.ts';

const T0 = Date.UTC(2026, 9, 21, 9);
const store = FEATURES.find((f) => f.id === 'storehouse')!;
const use = (s: State, item: string, action: { feature: string; id: string }) =>
  store.routes.useFind.run(s, { item, action }, T0) as {
    state: State;
    result: { ok: boolean; reason?: { code: string } };
    events?: { type: string; step?: number; item?: string; completions?: number }[];
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
    // Session 92's play: the use announces itself first (it was silent when it crossed no step).
    expect(r.events?.map((e) => e.type)).toEqual(['findUsed', 'masteryStep', 'masteryStep']);
    expect(r.events?.[0]).toMatchObject({
      item: 'carved-acorn',
      action: { feature: 'woodcutting', id: 'ash-tree' },
      completions: 500,
    });
    expect(r.events?.slice(1).map((e) => e.step)).toEqual([3, 4]);
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

// Session 154: a newcomer six days in held 200 carved acorns, one press each to use, and the list put
// first the pine their mastery had already filled, where a find adds nothing. A use may now spend several
// at once, and the list leaves out an action at full mastery and says how many bring the next step.
describe('using several Rare finds', () => {
  it('spends as many as asked on one action, and no more than are held', () => {
    const r = store.routes.useFind.run(
      { ...player, items: { 'carved-acorn': 5 } },
      { item: 'carved-acorn', action: { feature: 'woodcutting', id: 'ash-tree' }, count: 3 },
      T0,
    ) as unknown as {
      state: State;
      result: { ok: boolean };
      events: { type: string; completions?: number; count?: number }[];
    };
    expect(r.result).toEqual({ ok: true });
    expect(r.state.mastery['woodcutting:ash-tree']).toBe(1600);
    expect(r.state.items['carved-acorn']).toBe(2);
    expect(r.events[0]).toMatchObject({ type: 'findUsed', completions: 1500, count: 3 });
    const over = store.routes.useFind.run(
      { ...player, items: { 'carved-acorn': 2 } },
      { item: 'carved-acorn', action: { feature: 'woodcutting', id: 'ash-tree' }, count: 3 },
      T0,
    ) as unknown as { result: { ok: boolean; reason?: { code: string } } };
    expect(over.result).toEqual({ ok: false, reason: { code: 'notOwned' } });
  });

  it('offers only actions a find still helps, with how many bring the next step', () => {
    const s: State = {
      ...player,
      items: { 'carved-acorn': 200 },
      mastery: { 'woodcutting:pine-tree': 60_000, 'woodcutting:ash-tree': 100 },
    };
    const rows = findUses(s, 'carved-acorn');
    expect(rows.map((r) => r.action.id)).not.toContain('pine-tree');
    expect(rows[0]).toMatchObject({ action: { id: 'ash-tree' }, completions: 100, next: { count: 1, step: 4 } });
    // Among the unused, the latest opened first.
    expect(rows[1].action.id).toBe('old-pine');
  });
});
