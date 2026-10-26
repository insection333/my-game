// The shared completion every skill uses: finds and their luck, the collection log's first-find
// dates, lasting marks, and the level and mastery moments.
import { LUCK_GUARANTEE_MS, XP_TABLE } from '@idle-clash/content';
import {
  createEngine,
  isNotable,
  newState,
  seeded,
  type ActionContext,
  type GameEvent,
  type State,
} from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';
import { completeSkillAction, type CompletedAction, type SkillDefinition } from '../src/shared/complete.ts';
import { FINDS, LADDER } from '../src/woodcutting/content.ts';

const T0 = Date.UTC(2026, 9, 20, 9);
const DEF: SkillDefinition = { feature: 'woodcutting', skill: 'woodcutting', ladder: LADDER, finds: FINDS };
const pine: CompletedAction = {
  id: 'pine-tree',
  tier: 1,
  xp: 11,
  gives: [{ item: 'pine-logs', count: 1 }],
  findMultiple: 1,
};
const oak: CompletedAction = {
  id: 'oak-tree',
  tier: 3,
  xp: 52,
  gives: [{ item: 'oak-logs', count: 1 }],
  findMultiple: 1,
};

/** Runs n completions of an action back to back, 7.5 s apart, and returns the state and events. */
function chop(n: number, act = pine, opts: { fire?: boolean; state?: State; rolls?: () => number } = {}) {
  const state = opts.state ?? newState(3, T0);
  const events: GameEvent[] = [];
  const rng = seeded(99);
  let counter = 0;
  for (let i = 0; i < n; i++) {
    const at = state.clock + 7500;
    state.clock = at;
    const ctx: ActionContext = {
      state,
      at,
      startedAt: at - 7500,
      lane: 'gathering',
      fireBurning: opts.fire ?? false,
      fireMinutes: 0,
      roll: opts.rolls ?? (() => rng('gathering', counter++)),
      emit: (e) => events.push(e),
    };
    completeSkillAction(ctx, DEF, act);
    const key = `woodcutting:${act.id}`;
    state.mastery[key] = (state.mastery[key] ?? 0) + 1;
  }
  return { state, events };
}
const finds = (events: GameEvent[], rarity?: string) =>
  events.filter((e) => e.type === 'find' && (!rarity || e.rarity === rarity));

describe('finds', () => {
  it('turns up an Uncommon find about once in 50 actions, evenly spaced by luck', () => {
    const { events } = chop(50_000);
    const uncommon = finds(events, 'uncommon');
    expect(50_000 / uncommon.length).toBeGreaterThan(45);
    expect(50_000 / uncommon.length).toBeLessThan(56);
    // Without luck, gaps of 300 actions and more would turn up; with it, none comes close.
    const at = uncommon.map((e) => e.at);
    const gaps = at.slice(1).map((t, i) => (t - at[i]) / 7500);
    expect(Math.max(...gaps)).toBeLessThan(200);
  });

  it('turns up Rare finds about once in 500 actions, and greater finds only from tier 3 and 4', () => {
    const low = chop(100_000);
    const rare = finds(low.events, 'rare').length;
    expect(100_000 / rare).toBeGreaterThan(400);
    expect(100_000 / rare).toBeLessThan(625);
    const items = new Set(finds(low.events).map((e) => (e.type === 'find' ? e.item : '')));
    expect([...items].sort()).not.toContain('amber-nugget');
    expect([...items]).not.toContain('heartwood-knot');
    const high = chop(20_000, oak);
    expect(finds(high.events).some((e) => e.type === 'find' && e.item === 'amber-nugget')).toBe(true);
  });

  it('makes the next find certain after four minutes of active play with no moment', () => {
    const state = newState(3, T0);
    state.luck.lastMoment = T0 - LUCK_GUARANTEE_MS + 7500;
    const { events } = chop(1, pine, { fire: true, state, rolls: () => 0.99 });
    expect(finds(events)).toEqual([expect.objectContaining({ rarity: 'uncommon', item: 'birds-nest', first: true })]);
  });

  it('does not make it certain while away, when the fire is out', () => {
    const state = newState(3, T0);
    state.luck.lastMoment = T0 - 10 * LUCK_GUARANTEE_MS;
    const { events } = chop(1, pine, { fire: false, state, rolls: () => 0.99 });
    expect(finds(events)).toEqual([]);
  });

  it('dates the first find of each item in the collection log, and only the first', () => {
    const { state, events } = chop(400);
    const nests = finds(events).filter((e) => e.type === 'find' && e.item === 'birds-nest');
    expect(nests.length).toBeGreaterThan(2);
    expect(nests.map((e) => e.type === 'find' && e.first)).toEqual([true, ...nests.slice(1).map(() => false)]);
    expect(state.found['birds-nest']).toBe(nests[0].at);
    expect(state.items['birds-nest']).toBe(nests.length);
  });
});

describe('XP, marks and moments', () => {
  it('adds 2% XP in the skill for each Legendary ever found', () => {
    const state = newState(3, T0);
    state.found['silverbark-seed'] = T0 - 1;
    const { state: after } = chop(100, pine, { state, rolls: () => 0.99 });
    expect(after.skills.woodcutting).toEqual({ xp: 1122 });
  });

  it('announces each level and mastery step once, as it happens', () => {
    const { events } = chop(40);
    const levels = events.filter((e) => e.type === 'levelUp').map((e) => (e.type === 'levelUp' ? e.level : 0));
    expect(levels).toEqual([2, 3, 4]);
    const xp = 40 * 11;
    expect(xp).toBeGreaterThanOrEqual(XP_TABLE[4]);
    expect(events.filter((e) => e.type === 'masteryStep')).toEqual([
      expect.objectContaining({ step: 1, action: { feature: 'woodcutting', id: 'pine-tree' } }),
    ]);
  });

  it('counts a moment for the luck guarantee whenever one is announced', () => {
    const engine = createEngine(actionRegistry(FEATURES, () => true));
    const start = engine.command(
      newState(3, T0),
      T0,
      { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } },
      seeded(3),
    );
    const { state, events } = engine.advance(start.state, T0 + 60_000, seeded(3));
    const moments = events.filter(isNotable);
    expect(moments.length).toBeGreaterThan(0);
    expect(state.luck.lastMoment).toBe(moments.at(-1)!.at);
  });
});
