// New skills are met through the goals ladder (session 23): First steps teach Woodcutting, Mining,
// Smithing and Combat, and after them one short goal at a time invites the player to try a skill with
// work of its own they have never trained, once its first action can start: Fishing and Runecraft at
// once, Cooking and Fletching once their ingredients are held. Without it, the skills that join the
// game's loops (fish to food, logs and bars to arrows) waited to be found by chance.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { goals, type GoalsView } from '../src/goals/index.ts';
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
const levels = (skills: string[]) => Object.fromEntries(skills.map((s) => [s, { xp: XP_TABLE[5] }]));
const refresh = (s: State) => goals.routes.refresh.run(s, {}, T0).state;
const view = (s: State) => goals.slots['hearth.goals']({ state: s, now: T0 }) as unknown as GoalsView;

/** A player just past First steps, with these skills trained and these items held. */
function past(trained: string[], items: Record<string, number> = {}, seed = 1): State {
  return {
    ...newState(seed, T0),
    skills: levels(trained),
    items,
    features: { goals: { claimed: FIRST, short: [], made: 0, daily: null, milestones: [], opened: 0 } },
  };
}
const tries = (s: State) => goalsOf(s).short.filter((g) => g.tries);

describe('trying a new skill', () => {
  it('invites a player who has never fished or drawn runes to try one, worded as an invitation', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const s = refresh(past(['woodcutting', 'mining', 'smithing', 'melee', 'hitpoints'], {}, seed));
      const [t, ...more] = tries(s);
      expect(more).toEqual([]);
      expect(['fishing', 'runecraft']).toContain(t.skill);
      expect(t).toMatchObject({ kind: 'count', target: 5, base: 0 });
      expect(view(s).rows.map((r) => r.name)).toContainEqual(expect.stringMatching(/^Try (Fishing|Runecraft): .+ ×5$/));
    }
  });

  it('invites Cooking and Fletching only once what they take is held', () => {
    const tried = ['woodcutting', 'mining', 'smithing', 'melee', 'hitpoints', 'fishing', 'runecraft'];
    expect(tries(refresh(past(tried)))).toEqual([]);
    const cook = tries(refresh(past([...tried, 'fletching'], { perch: 10, 'pine-logs': 5 })));
    expect(cook.map((g) => g.skill)).toEqual(['cooking']);
    const fletch = tries(refresh(past([...tried, 'cooking'], { 'copper-bar': 5, 'pine-logs': 5 })));
    expect(fletch.map((g) => g.skill)).toEqual(['fletching']);
  });

  it('asks nothing of a player who has tried every skill', () => {
    const all = [
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
    expect(tries(refresh(past(all, { perch: 10, 'pine-logs': 5 })))).toEqual([]);
  });
});
