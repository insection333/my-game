// The goals ladder after First steps: three short goals in different skills, each about 10–15 minutes
// of the player's pace and paying about 10 minutes of its gold; claiming one pays it and makes the
// next; a daily goal of about 40 minutes of XP, new each day; and milestones paid once.
import { XP_TABLE } from '@idle-clash/content';
import { createEngine, HOUR, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { goals, type GoalsView } from '../src/goals/index.ts';
import { paces } from '../src/goals/pace.ts';
import { goalsOf, type ShortGoal } from '../src/goals/state.ts';
import { actionRegistry, FEATURES } from '../src/index.ts';

const T0 = Date.UTC(2026, 9, 21, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const FIRST = [
  'chop-a-pine',
  'mine-copper-ore',
  'smelt-a-copper-bar',
  'forge-a-copper-sword',
  'wear-your-sword',
  'defeat-a-hollow-rat',
];
const levels = (l: Record<string, number>) =>
  Object.fromEntries(Object.entries(l).map(([k, v]) => [k, { xp: XP_TABLE[v] }]));
const player = (seed = 3): State => ({
  ...newState(seed, T0),
  skills: levels({ woodcutting: 12, mining: 9, smithing: 8, melee: 6, hitpoints: 5 }),
  items: { 'copper-sword': 1, bread: 20, 'copper-ore': 200, 'tin-ore': 200 },
  features: {
    goals: { claimed: FIRST },
    combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: T0, retreated: null },
  },
});
const refresh = (s: State, now = T0) => goals.routes.refresh.run(s, {}, now).state;
const claim = (s: State, goal: string, now = T0) => goals.routes.claim.run(s, { goal }, now);
const view = (s: State, now = T0) => goals.slots['hearth.goals']({ state: s, now }) as unknown as GoalsView;

describe('the goals ladder', () => {
  it('makes three short goals in different skills, each 10 to 15 minutes of pace, the same on server and page', () => {
    const s = refresh(player());
    const g = goalsOf(s);
    expect(g.short).toHaveLength(3);
    expect(new Set(g.short.map((x) => x.skill)).size).toBe(3);
    const pace = paces(s);
    for (const goal of g.short.filter((x) => x.kind === 'count')) {
      const p = pace.find((x) => x.action.id === goal.action.id)!;
      const minutes = (goal.target * p.secondsEach) / 60;
      expect(minutes).toBeGreaterThanOrEqual(9);
      expect(minutes).toBeLessThanOrEqual(16);
      const payMinutes = (goal.reward / p.goldEach) * (p.secondsEach / 60);
      expect(Math.max(10, payMinutes)).toBeLessThanOrEqual(12);
    }
    expect(refresh(player())).toEqual(s);
    expect(goalsOf(refresh(player(4))).short).not.toEqual(g.short);
  });

  it('pays a short goal once its work is done, says so by name, and makes the next', () => {
    let s = refresh(player());
    const goal = goalsOf(s).short.find((x) => x.kind === 'count' && x.lane === 'gathering') as ShortGoal;
    const row = view(s).rows.find((r) => r.id === goal.id)!;
    expect(row).toMatchObject({ state: 'todo', count: `0 of ${goal.target}` });
    expect(claim(s, goal.id).result).toEqual({ ok: false, reason: 'notDone' });
    s = engine.command(
      s,
      T0,
      (row.button as unknown as { command: Parameters<typeof engine.command>[2] }).command,
      seeded(1),
    ).state;
    s = engine.advance(s, T0 + HOUR, seeded(1)).state;
    expect(view(s, T0 + HOUR).rows.find((r) => r.id === goal.id)).toMatchObject({ state: 'ready' });
    const paid = claim(s, goal.id, T0 + HOUR);
    // It pays in a supply cache: what the cache held is what arrived, at least half the goal's gold.
    const event = paid.events?.[0] as { cache: { items: { item: string; count: number }[] } };
    expect(paid.events?.[0]).toMatchObject({ type: 'goalDone', goal: goal.id, name: row.name });
    const got = event.cache.items.find((i) => i.item === 'gold')!.count;
    expect(paid.state.items.gold ?? 0).toBe((s.items.gold ?? 0) + got);
    expect(got).toBeGreaterThanOrEqual(Math.round(goal.reward / 2));
    const after = goalsOf(paid.state).short;
    expect(after).toHaveLength(3);
    expect(after.map((x) => x.id)).not.toContain(goal.id);
    expect(claim(paid.state, goal.id, T0 + HOUR).result).toEqual({ ok: false, reason: 'unknown' });
  });

  it('sets a daily goal of about 40 minutes of XP, claimable once, and a new one the next day', () => {
    let s = refresh(player());
    const daily = goalsOf(s).daily!;
    expect(daily.day).toBe('2026-10-21');
    s = { ...s, skills: { ...s.skills, [daily.skill]: { xp: daily.base + daily.target } } };
    const once = claim(s, 'daily').state;
    const paid = once.items.gold ?? 0;
    expect(paid).toBeGreaterThanOrEqual(Math.round(daily.reward / 2));
    expect(claim(once, 'daily').state.items.gold).toBe(paid);
    expect(view(once).rows.find((r) => r.id === 'daily')).toMatchObject({ state: 'claimed' });
    const tomorrow = T0 + 24 * HOUR;
    expect(view(once, tomorrow).refresh).toBe(true);
    expect(goalsOf(refresh(once, tomorrow)).daily).toMatchObject({ day: '2026-10-22', claimed: false });
  });

  it('pays a milestone once when it is reached', () => {
    const s = refresh(player());
    const at50 = { ...s, skills: levels({ woodcutting: 20, mining: 15, smithing: 10, melee: 5 }) };
    expect(view(s).rows.some((r) => r.id.startsWith('m-'))).toBe(true);
    expect(claim(s, 'm-total-50').result).toEqual({ ok: false, reason: 'notDone' });
    const paid = claim(at50, 'm-total-50').state;
    expect(paid.items.gold).toBe(2_000);
    expect(goalsOf(paid).milestones).toEqual(['total-50']);
    expect(claim(paid, 'm-total-50').result).toEqual({ ok: false, reason: 'unknown' });
  });
});
