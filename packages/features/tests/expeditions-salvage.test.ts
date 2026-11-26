// Session 263: an expeditions part that did not read was let go whole (marks, relics, wins and all) unless only
// its run was at fault; the day's list of bosses and the fights banked, each made again by tomorrow, now go
// before anything that took a player months.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { expeditionsOf } from '../src/shared/expeditions/state.ts';
import { storeOf } from '../src/shared/storehouse.ts';
import { goalsOf } from '../src/goals/state.ts';
import { deedsOf } from '../src/deeds/state.ts';

const T0 = Date.UTC(2026, 10, 26, 9);
const withPart = (part: object, id = 'expeditions'): State => {
  const s = newState(1, T0);
  return { ...s, features: { ...s.features, [id]: part } };
};
const base = {
  marks: 500,
  relics: { 'heartwood-charm': 3 },
  drawn: 4,
  run: null,
  wins: { 'troll-chief': 12 },
  runs: {},
  twists: [],
  bossDay: {},
};

describe('an expeditions part that does not read', () => {
  it('keeps its marks, relics and wins, letting the day’s list go', () => {
    const e = expeditionsOf(
      withPart({ ...base, round: { day: '2026-11-26', foes: Array.from({ length: 40 }, () => 'troll-chief') } }),
    );
    expect([e.marks, e.relics['heartwood-charm'], e.wins['troll-chief'], e.round]).toEqual([500, 3, 12, undefined]);
  });

  it('keeps them, letting the fights banked go', () => {
    const e = expeditionsOf(
      withPart({
        ...base,
        bossLeft: { 'troll-chief': 9 },
        realm: { day: '2026-11-25', claimed: null, fallen: 2, left: 7 },
      }),
    );
    expect([e.marks, e.wins['troll-chief'], e.bossLeft?.['troll-chief'], e.realm?.fallen, e.realm?.left]).toEqual([
      500,
      12,
      undefined,
      2,
      undefined,
    ]);
  });
});

describe('another part that does not read', () => {
  it('lets go of its locks, gifts opened or deeds followed, and keeps the rest', () => {
    expect(storeOf(withPart({ enlargements: 4, locked: ['Not An Item!'] }, 'storehouse')).enlargements).toBe(4);
    const goals = goalsOf(
      withPart(
        { claimed: [], short: [], made: 7, daily: null, milestones: [], opened: 31, week: null, weeks: 3, gifts: [-1] },
        'goals',
      ),
    );
    expect([goals.opened, goals.weeks]).toEqual([31, 3]);
    const deeds = deedsOf(withPart({ done: { 'level-woodcutting-10': T0 }, followed: ['a', 'b', 'c', 'd'] }, 'deeds'));
    expect(Object.keys(deeds.done)).toEqual(['level-woodcutting-10']);
  });
});
