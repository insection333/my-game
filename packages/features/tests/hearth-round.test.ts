// Session 242: the Hearth's round. Goals ready were claimed one press each (six first steps, then three short
// goals, the day's and the week's); Claim all takes them at one press, each as its own Claim would. A deed
// worked towards stood only on the Deeds tab; up to three are followed in the Hearth's Next up. A player's
// card gains their lifetime records.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { goals, type GoalsView } from '../src/goals/index.ts';
import { goalsOf } from '../src/goals/state.ts';
import { deeds } from '../src/deeds/index.ts';
import { deedsOf } from '../src/deeds/state.ts';
import { careerOf } from '../src/deeds/career.ts';
import type { DeedStep } from '../src/deeds/view.ts';

const T0 = Date.UTC(2026, 10, 26, 9);
const view = (s: State) => goals.slots['hearth.goals']({ state: s, now: T0 }) as unknown as GoalsView;
const ready = (s: State) => view(s).rows.filter((r) => r.button && 'claim' in r.button).length;

/** A newcomer who has done the first steps' work and claimed none of them. */
function newcomer(): State {
  return {
    ...newState(42, T0),
    skills: { woodcutting: { xp: XP_TABLE[3] }, mining: { xp: XP_TABLE[3] }, smithing: { xp: XP_TABLE[3] } },
    items: { 'copper-sword': 1, 'copper-bar': 1, 'copper-ore': 4, 'pine-logs': 9 },
    mastery: {
      'woodcutting:pine-tree': 9,
      'mining:copper-vein': 6,
      'smithing:copper-bar': 2,
      'smithing:copper-sword': 1,
      'combat:hollow-rat': 2,
    },
    features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: T0, retreated: null } },
  };
}

describe('Claim all', () => {
  it('claims every goal ready at one press, each said as its own Claim would', () => {
    const s = newcomer();
    const n = ready(s);
    expect(n).toBeGreaterThanOrEqual(2);
    expect(view(s).claimAll).toBe(`Claim all ${n}`);
    const r = goals.routes.claimAll.run(s, {}, T0) as {
      state: State;
      result: { ok: boolean; count: number };
      events: { type: string }[];
    };
    // The first steps, and what claiming them brings ready (a milestone already done).
    expect(r.result.ok).toBe(true);
    expect(r.result.count).toBeGreaterThanOrEqual(n);
    expect(r.events.filter((e) => e.type === 'goalDone')).toHaveLength(r.result.count);
    expect(goalsOf(r.state).claimed.length).toBe(n);
    expect(ready(r.state)).toBe(0);
    expect(view(r.state).claimAll).toBeNull();
    expect(goals.routes.claimAll.run(r.state, {}, T0).result).toEqual({ ok: false, count: 0 });
  });
});

describe('a deed followed', () => {
  const follow = (s: State, id: string, on = true) =>
    deeds.routes.follow.run(s, { id, on }, T0) as { state: State; result: { ok: boolean; reason?: string } };
  const shown = (s: State) =>
    (deeds.slots['hearth.followed']({ state: s, now: T0 }) as unknown as DeedStep[]).map((d) => d.id);

  it('stands in Next up with its progress, three at most, and goes once done', () => {
    let s = newcomer();
    for (const id of ['level-woodcutting-10', 'level-mining-10', 'level-smithing-10']) s = follow(s, id).state;
    expect(shown(s)).toEqual(['level-woodcutting-10', 'level-mining-10', 'level-smithing-10']);
    // A fourth lets the first go.
    s = follow(s, 'level-woodcutting-25').state;
    expect(shown(s)).toEqual(['level-mining-10', 'level-smithing-10', 'level-woodcutting-25']);
    s = follow(s, 'level-mining-10', false).state;
    expect(deedsOf(s).followed).toEqual(['level-smithing-10', 'level-woodcutting-25']);
    const done = { ...s, features: { ...s.features, deeds: { ...deedsOf(s), done: { 'level-smithing-10': T0 } } } };
    expect(shown(done)).toEqual(['level-woodcutting-25']);
    expect(follow(done, 'level-smithing-10').result).toEqual({ ok: false, reason: 'done' });
    expect(follow(s, 'no-such-deed').result).toEqual({ ok: false, reason: 'unknown' });
  });
});

describe('the lifetime records on a card', () => {
  it('count finds logged of all there are, bounties, weeks kept and the realm felled', () => {
    const s = newcomer();
    s.found = { 'birds-nest': T0, 'carved-acorn': T0 };
    const c = careerOf(s, T0);
    expect(c.finds).toBe(2);
    expect(c.findsAll).toBeGreaterThan(70);
    expect([c.bounties, c.weeks, c.favour, c.realmFallen]).toEqual([0, 0, 0, 0]);
  });
});
