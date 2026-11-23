// The week's contract (session 172): nothing sat between the day's goal and the eight-week season. Four
// tasks, each about eight hours of the player's own pace (so a lane left at it does it while they are away),
// counted only from when the contract was made; one swap a week; done, a cache worth four hours of their
// earning and a week kept, which is never taken away; a contract done and left unclaimed waits past its week.
import { XP_TABLE } from '@idle-clash/content';
import { HOUR, newState, xpOf, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import type { GoalsView } from '../src/goals/index.ts';
import { goals } from '../src/goals/index.ts';
import { FEATURES } from '../src/index.ts';
import { bestIn, paces } from '../src/shared/pace.ts';
import { goalsOf } from '../src/goals/state.ts';
import { measure, weekOf } from '../src/goals/week.ts';

// A Wednesday.
const T0 = Date.UTC(2026, 10, 25, 9);
const DAY = 24 * HOUR;
const levels = (l: Record<string, number>) =>
  Object.fromEntries(Object.entries(l).map(([k, v]) => [k, { xp: XP_TABLE[v] }]));
const FIRST = [
  'chop-a-pine',
  'mine-copper-ore',
  'smelt-a-copper-bar',
  'forge-a-copper-sword',
  'wear-your-sword',
  'defeat-a-hollow-rat',
];
const player = (): State => ({
  ...newState(3, T0),
  skills: levels({ woodcutting: 22, mining: 18, smithing: 15, melee: 12, hitpoints: 12 }),
  items: { 'copper-sword': 1, bread: 20, 'copper-ore': 200, 'tin-ore': 200 },
  features: {
    goals: { claimed: FIRST },
    combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: T0, retreated: null },
  },
});
const view = (s: State, now: number) => goals.slots['hearth.goals']({ state: s, now }) as unknown as GoalsView;
const weekRow = (s: State, now: number) => view(s, now).rows.find((r) => r.id === 'week');

/** Every task done: each count moved past its target. */
function allDone(s: State): State {
  const out = structuredClone(s);
  for (const task of goalsOf(s).week!.tasks) {
    if (task.kind === 'xp') out.skills[task.skill!] = { xp: task.base + task.target };
    if (task.kind === 'count') out.mastery[`${task.action!.feature}:${task.action!.id}`] = task.base + task.target;
    if (task.kind === 'mastery') out.mastery['woodcutting:yew-tree'] = 1_000_000;
    if (task.kind === 'boss') out.features.expeditions = { wins: { 'troll-chief': task.base + task.target } };
  }
  return out;
}

describe("the week's contract", () => {
  const made = goals.routes.refresh.run(player(), {}, T0).state;
  const w = goalsOf(made).week!;

  it('is made with the day’s goal: four tasks of about eight hours each, counted from now', () => {
    expect(w.week).toBe('2026-11-23');
    expect(w.tasks).toHaveLength(4);
    const row = weekRow(made, T0)!;
    expect(row.parts).toHaveLength(4);
    expect(row.parts!.every((p) => p.count.startsWith('0 of'))).toBe(true);
    for (const task of w.tasks.filter((x) => x.kind === 'xp')) {
      expect(task.base).toBe(xpOf(made, task.skill!));
      const p = bestIn(paces(made), task.skill!)!;
      const hours = task.target / ((p.xpEach / p.secondsEach) * 3600);
      expect(hours).toBeGreaterThan(6);
      expect(hours).toBeLessThan(11);
    }
    expect(measure(made, w.tasks[0])).toBe(w.tasks[0].base);
  });

  it('pays a cache and a week kept once every task is done, once', () => {
    expect(goals.routes.claim.run(made, { goal: 'week' }, T0).result).toEqual({ ok: false, reason: 'notDone' });
    const done = allDone(made);
    expect(weekRow(done, T0)!.state).toBe('ready');
    const r = goals.routes.claim.run(done, { goal: 'week' }, T0);
    expect(r.result).toEqual({ ok: true });
    expect(goalsOf(r.state).weeks).toBe(1);
    expect(r.events?.[0]).toMatchObject({ type: 'goalDone', goal: 'week' });
    expect((r.events?.[0] as { name?: string }).name).toMatch(/first week/);
    expect(r.state.items.gold ?? 0).toBeGreaterThan(done.items.gold ?? 0);
    const again = goals.routes.claim.run(r.state, { goal: 'week' }, T0);
    expect(goalsOf(again.state).weeks).toBe(1);
    // Done: it stands claimed until the week turns, then a new contract comes.
    expect(weekRow(r.state, T0)!.state).toBe('claimed');
    const next = goals.routes.refresh.run(r.state, {}, T0 + 6 * DAY).state;
    expect(goalsOf(next).week!.week).toBe(weekOf(T0 + 6 * DAY));
    expect(goalsOf(next).weeks).toBe(1);
  });

  it('swaps one task once a week', () => {
    const r = goals.routes.swap.run(made, { task: 0 }, T0);
    expect(r.result).toEqual({ ok: true });
    expect(goalsOf(r.state).week!.tasks[0]).not.toEqual(w.tasks[0]);
    expect(goals.routes.swap.run(r.state, { task: 1 }, T0).result).toEqual({ ok: false });
    expect(weekRow(r.state, T0)!.parts!.every((p) => p.swap === null)).toBe(true);
  });

  it('waits past its week when done and unclaimed, and goes when left undone', () => {
    const done = allDone(made);
    const later = T0 + 9 * DAY;
    expect(weekRow(done, later)!.state).toBe('ready');
    expect(goals.routes.claim.run(done, { goal: 'week' }, later).result).toEqual({ ok: true });
    const undone = goals.routes.refresh.run(made, {}, later).state;
    expect(goalsOf(undone).week!.week).toBe(weekOf(later));
    expect(goalsOf(undone).weeks).toBe(0);
  });

  it('counts the work made, not the completions a Rare find gives it (session 181)', () => {
    const s = made;
    const task = w.tasks.find((t) => t.kind === 'count')!;
    expect(task).toBeDefined();
    const store = FEATURES.find((f) => f.id === 'storehouse')!;
    const held = { ...s, items: { ...s.items, 'guild-smiths-seal': 2 } };
    const used = store.routes.useFind.run(held, { item: 'guild-smiths-seal', action: task.action!, count: 2 }, T0) as {
      state: State;
      result: { ok: boolean };
    };
    expect(used.result.ok).toBe(true);
    expect(measure(used.state, task)).toBe(measure(s, task));
  });
});
