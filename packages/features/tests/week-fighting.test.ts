// The week's contract asks first for XP in the skills at work in the player's lanes (session 172), yet a
// Combat lane on an expedition, a boss or a descent of the Deep runs the expeditions feature's actions, so
// the style it trains was not taken as at work and a skill left idle was asked for in its place, by the week's
// contract and the day's goal alike (session 226).
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { makeDaily } from '../src/goals/ladder.ts';
import { candidates } from '../src/goals/week.ts';

const T0 = Date.UTC(2026, 10, 25, 9);
const levels = (l: Record<string, number>) =>
  Object.fromEntries(Object.entries(l).map(([k, v]) => [k, { xp: XP_TABLE[v] }]));

function player(combat: { feature: string; id: string }): State {
  const s: State = {
    ...newState(3, T0),
    skills: levels({ mining: 40, woodcutting: 22, melee: 30, hitpoints: 30 }),
    items: { 'iron-sword': 1, bread: 20 },
    features: { combat: { worn: { weapon: 'iron-sword' }, health: null, healthAt: T0, retreated: null } },
  };
  s.lanes.gathering.current = { action: { feature: 'woodcutting', id: 'pine-tree' }, startedAt: T0, endsAt: T0 + 5000 };
  s.lanes.combat.current = { action: combat, startedAt: T0, endsAt: T0 + 600_000 };
  return s;
}

describe("the week's contract and the Combat lane", () => {
  it('takes the style as at work while the lane fights a foe, a run, a boss or the Deep', () => {
    for (const action of [
      { feature: 'combat', id: 'hollow-rat' },
      { feature: 'expeditions', id: 'march' },
      { feature: 'expeditions', id: 'troll-chief' },
      { feature: 'expeditions', id: 'deep' },
    ]) {
      const first = candidates(player(action), T0)
        .filter((t) => t.kind === 'xp')
        .slice(0, 2)
        .map((t) => t.skill);
      expect(first.sort(), action.id).toEqual(['melee', 'woodcutting']);
    }
  });

  it("draws the day's goal among the skills at work, the style on a run among them", () => {
    // Only the Combat lane at work, on a run: the day's goal is the style's, every day of a week.
    for (let d = 0; d < 7; d++) {
      const s = player({ feature: 'expeditions', id: 'march' });
      s.lanes.gathering.current = null;
      expect(makeDaily(s, T0 + d * 86_400_000)?.skill).toBe('melee');
    }
  });
});
