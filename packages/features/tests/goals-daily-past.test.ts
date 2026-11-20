// A day's goal kept past its day says so (session 157). A daily goal done and not claimed is kept until it
// is claimed, so its cache is never lost; but the elder, back after a month, read "Earn 26,100 Melee XP
// today" over a goal done thirty days before, and its cache's moment said the same.
import { XP_TABLE } from '@idle-clash/content';
import { HOUR, newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import type { GoalsView } from '../src/goals/index.ts';
import { goals } from '../src/goals/index.ts';
import '../src/index.ts';
import { goalsOf } from '../src/goals/state.ts';

const T0 = Date.UTC(2026, 9, 21, 9);
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
  skills: levels({ woodcutting: 12, mining: 9, smithing: 8, melee: 6, hitpoints: 5 }),
  items: { 'copper-sword': 1, bread: 20, 'copper-ore': 200, 'tin-ore': 200 },
  features: {
    goals: { claimed: FIRST },
    combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: T0, retreated: null },
  },
});
const view = (s: State, now: number) => goals.slots['hearth.goals']({ state: s, now }) as unknown as GoalsView;

describe("a day's goal kept past its day", () => {
  const made = goals.routes.refresh.run(player(), {}, T0).state;
  const d = goalsOf(made).daily!;
  const done: State = { ...made, skills: { ...made.skills, [d.skill]: { xp: d.base + d.target } } };

  it('says today on its day, and not a month later', () => {
    expect(view(done, T0).rows.find((r) => r.id === 'daily')!.name).toMatch(/ today$/);
    const later = view(done, T0 + 30 * DAY).rows.find((r) => r.id === 'daily')!;
    expect(later.name).not.toMatch(/today/);
    expect(later.name).toMatch(/earlier day/);
  });

  it('is claimed under the same words', () => {
    const r = goals.routes.claim.run(done, { goal: 'daily' }, T0 + 30 * DAY);
    expect(JSON.stringify(r.events)).not.toMatch(/today/);
  });
});
