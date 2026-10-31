// Ten minutes of a player's time is worth the same in every lane (session 24): a goal pays by the
// player's best gold an hour among the work that makes gold from nothing (gathering and fights), not by
// the goal's own action. Before, an artisan goal paid by the value its work added to its ingredients:
// a ten-minute Cooking goal at level 99 paid about 7 gold, beside Woodcutting's 7,000.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { goals } from '../src/goals/index.ts';
import { makeDaily, makeShort } from '../src/goals/ladder.ts';
import { paces } from '../src/goals/pace.ts';
import { goalsOf } from '../src/goals/state.ts';
import '../src/index.ts';

const T0 = Date.UTC(2026, 10, 1, 9);
const FIRST = [
  'chop-a-pine',
  'mine-copper-ore',
  'smelt-a-copper-bar',
  'forge-a-copper-sword',
  'wear-your-sword',
  'defeat-a-hollow-rat',
];
const SKILLS = [
  'woodcutting',
  'mining',
  'fishing',
  'runecraft',
  'smithing',
  'cooking',
  'fletching',
  'melee',
  'hitpoints',
];

/** A player at `level` in every skill, past First steps, its artisan lane at `action`. */
function at(level: number, action: { feature: string; id: string }, seed = 2): State {
  const s: State = {
    ...newState(seed, T0),
    skills: Object.fromEntries(SKILLS.map((k) => [k, { xp: XP_TABLE[level] }])),
    items: { perch: 10_000, 'pine-logs': 10_000, 'copper-ore': 10_000, 'copper-bar': 10_000 },
    features: { goals: { claimed: FIRST, short: [], made: 0, daily: null, milestones: [], opened: 0 } },
  };
  s.lanes.artisan = { ...s.lanes.artisan, current: { action, startedAt: T0, endsAt: T0 + 60_000 } };
  return s;
}

/** The player's best gold a second among work that makes gold from nothing. */
const earning = (s: State) =>
  Math.max(
    ...paces(s)
      .filter((p) => p.lane !== 'artisan')
      .map((p) => p.goldEach / p.secondsEach),
  );

describe('what a goal pays', () => {
  it('pays an artisan goal as much as ten minutes of the player’s best work', () => {
    for (const [level, action] of [
      [99, { feature: 'cooking', id: 'cooked-perch' }],
      [60, { feature: 'smithing', id: 'copper-bar' }],
      [30, { feature: 'fletching', id: 'copper-arrows' }],
    ] as const) {
      const s = at(level, action);
      const goal = makeShort(s, goalsOf(s), T0)!;
      expect(goal.lane).toBe('artisan');
      const ten = earning(s) * 600;
      expect(goal.reward).toBeGreaterThan(ten * 0.85);
      expect(goal.reward).toBeLessThan(ten * 1.15);
    }
  });

  it('pays the daily goal about an hour of that, whatever its skill', () => {
    const s = at(99, { feature: 'cooking', id: 'cooked-perch' });
    const daily = makeDaily(s, T0)!;
    const hour = earning(s) * 3600;
    expect(daily.reward).toBeGreaterThan(hour * 0.85);
    expect(daily.reward).toBeLessThan(hour * 1.15);
  });

  it('is made the same on the server and the page', () => {
    const s = at(99, { feature: 'cooking', id: 'cooked-perch' });
    const a = goals.routes.refresh.run(s, {}, T0).state;
    const b = goals.routes.refresh.run(s, {}, T0).state;
    expect(goalsOf(a)).toEqual(goalsOf(b));
  });
});
