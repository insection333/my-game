// Goals that follow the lanes (found by the year's simulation, step 18): from the first month a
// player's own work rarely finished a short goal drawn at random from every skill they had trained, so
// the goals ladder fell silent. Short goals now follow what the lanes are doing (a suggestion only when
// every lane's work already has one), today's daily goal is a skill at work, and a goal that has not
// moved in a day is retired for a fresh one.
import { XP_TABLE } from '@idle-clash/content';
import { createEngine, HOUR, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { goals } from '../src/goals/index.ts';
import { goalsOf } from '../src/goals/state.ts';
import { actionRegistry, FEATURES } from '../src/index.ts';

const T0 = Date.UTC(2026, 9, 28, 9);
const DAY = 24 * HOUR;
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
const refresh = (s: State, now = T0) => goals.routes.refresh.run(s, {}, now).state;

/** A player a month in with every skill trained, chopping oak and smelting iron. */
function atWork(seed: number): State {
  const s: State = {
    ...newState(seed, T0),
    skills: levels({
      woodcutting: 31,
      mining: 30,
      fishing: 28,
      runecraft: 26,
      smithing: 30,
      cooking: 27,
      fletching: 25,
      melee: 30,
      archery: 22,
      magic: 24,
      hitpoints: 33,
    }),
    items: { 'iron-ore': 5000, 'iron-sword': 1, 'meat-pie': 500 },
    features: {
      goals: { claimed: FIRST },
      combat: { worn: { weapon: 'iron-sword' }, health: null, healthAt: T0, retreated: null },
    },
  };
  const rng = seeded(seed);
  const start = (st: State, lane: 'gathering' | 'artisan', feature: string, id: string) =>
    engine.command(st, T0, { type: 'start', lane, action: { feature, id } }, rng).state;
  return start(start(s, 'gathering', 'woodcutting', 'oak-tree'), 'artisan', 'smithing', 'iron-bar');
}

describe('goals that follow the lanes', () => {
  it("gives each lane's work a short goal, so the player's own play finishes them", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const short = goalsOf(refresh(atWork(seed))).short;
      const ids = short.map((g) => g.action.id);
      expect(ids, `seed ${seed}`).toContain('oak-tree');
      expect(ids, `seed ${seed}`).toContain('iron-bar');
    }
  });

  it('draws the daily goal from a skill at work in the lanes that keep working all day', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      // Mining in the fire's second lane goes when the player leaves and the fire goes out.
      const s = engine.command(
        atWork(seed),
        T0,
        { type: 'start', lane: 'gathering2', action: { feature: 'mining', id: 'iron-vein' } },
        seeded(seed),
      ).state;
      expect(['woodcutting', 'smithing'], `seed ${seed}`).toContain(goalsOf(refresh(s)).daily!.skill);
    }
  });

  it("turns a lane's goal to the lane's new work as soon as the lane turns", () => {
    const s = refresh(atWork(1));
    const oak = goalsOf(s).short.find((g) => g.action.id === 'oak-tree')!;
    const turned = engine.command(
      s,
      T0 + HOUR,
      { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'old-oak' } },
      seeded(1),
    ).state;
    const ids = goalsOf(refresh(turned, T0 + HOUR)).short.map((g) => g.action.id);
    expect(ids).not.toContain('oak-tree');
    expect(ids).toContain('old-oak');
    expect(goalsOf(refresh(turned, T0 + HOUR)).short.map((g) => g.id)).not.toContain(oak.id);
  });

  it('keeps a suggestion a day, then makes way for a fresh one', () => {
    const idle = refresh({ ...atWork(1), lanes: newState(1, T0).lanes });
    const [first] = goalsOf(idle).short;
    expect(goalsOf(refresh(idle, T0 + DAY / 2)).short.map((g) => g.id)).toContain(first.id);
    expect(goalsOf(refresh(idle, T0 + DAY + 1)).short.map((g) => g.id)).not.toContain(first.id);
  });
});

describe("a day's goal", () => {
  it('is paid on the next visit when it was done while the player was away, and then today’s is set', () => {
    const s = refresh(atWork(2));
    const daily = goalsOf(s).daily!;
    // Done overnight; the player is back the next morning.
    const done = { ...s, skills: { ...s.skills, [daily.skill]: { xp: daily.base + daily.target } } };
    const morning = refresh(done, T0 + DAY);
    expect(goalsOf(morning).daily).toMatchObject({ day: daily.day, claimed: false });
    const claimed = goals.routes.claim.run(morning, { goal: 'daily' }, T0 + DAY);
    expect(claimed.result).toEqual({ ok: true });
    expect(claimed.events?.[0]).toMatchObject({ type: 'goalDone', goal: 'daily' });
    expect(goalsOf(claimed.state).daily?.day).not.toBe(daily.day);
  });

  it('is replaced when it was not done by the next day', () => {
    const s = refresh(atWork(2));
    const daily = goalsOf(s).daily!;
    expect(goalsOf(refresh(s, T0 + DAY)).daily?.day).not.toBe(daily.day);
  });
});
