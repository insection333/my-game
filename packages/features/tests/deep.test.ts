// The Deep (session 212, the plan *Dead and short content, 23 November*): combat after 99 had no new place, foe
// or challenge. A descent under the Ashen Peaks goes one depth at a time in the Combat lane, its foes growing
// with each, a boss every tenth depth, the week's omens holding for everyone; a waystone at each tenth depth
// is where the next descent starts; a retreat or a boss that holds ends it, said once. A descent carries a
// pack of meals, so food, not the clock, decides how deep it goes.
import { MINUTE, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { FOES } from '../src/shared/combat/data.ts';
import { bossDepth, deepBoss, DEEP as NUMBERS, deepFoe, omensOf, waystoneOf } from '../src/shared/expeditions/deep.ts';
import { expeditionsOf } from '../src/shared/expeditions/state.ts';
import { deepOf, descend } from '../src/expeditions/deep.ts';
import { engine, fighterOfLevel, T0 } from './helpers/expedition.ts';

const DEEP = { feature: 'expeditions', id: 'deep' };
const veteran = (seed = 1): State => fighterOfLevel(99, seed, 'melee');

/** Descends from the waystone and plays the lane for `hours`: the state after and its events. */
function descent(s0: State, hours: number) {
  let s = descend(s0).state;
  s = engine.command(s, T0, { type: 'start', lane: 'combat', action: DEEP }, seeded(3)).state;
  const out = engine.advance(s, T0 + hours * 60 * MINUTE, seeded(3));
  return { state: out.state, events: out.events };
}

describe('the Deep', () => {
  it('opens at Hitpoints 99, and a descent goes down a depth each ten minutes', () => {
    const young = fighterOfLevel(95, 1, 'melee');
    expect(descend(young).result).toEqual({ ok: false, reason: 'locked' });
    const { state } = descent(veteran(), 1);
    expect(deepOf(state).run?.depth).toBe(6);
    expect(expeditionsOf(state).marks).toBeGreaterThanOrEqual(6);
  });

  it('grows its foes with depth, and sets one of the six bosses, as strong as the Wyrm, at each tenth', () => {
    const golem = FOES.find((f) => f.id === 'obsidian-golem')!;
    expect(deepFoe(golem, 25).hp).toBe(golem.hp * 2);
    expect(bossDepth(10) && bossDepth(60) && !bossDepth(15)).toBe(true);
    expect([10, 20, 30, 40, 50, 60].map((d) => deepBoss(d).id)).toEqual([
      'barrow-king',
      'troll-chief',
      'mire-mother',
      'drowned-warden',
      'storm-roc',
      'ember-wyrm',
    ]);
    expect(deepBoss(20).hp).toBeGreaterThan(deepBoss(10).hp);
    expect(deepBoss(10).trait?.kind).toBe('rise');
  });

  it('ends on its pack of meals, said once, and leaves a waystone the next descent starts from', () => {
    const before = veteran();
    const [meal] = Object.entries(before.items).find(([, n]) => n === 50_000)!;
    const { state, events } = descent(before, 24);
    const done = events.filter((e) => e.type === 'deepDone');
    expect(done).toHaveLength(1);
    const d = deepOf(state);
    expect(d.run).toBeNull();
    expect(d.deepest).toBeGreaterThanOrEqual(10);
    expect(done[0]).toMatchObject({ from: 0, record: true, deepest: d.deepest });
    // No deeper for a day away than for a few hours: the pack is eaten, and no more.
    expect(done[0].at - T0).toBeLessThan(6 * 60 * MINUTE);
    expect(50_000 - state.items[meal]).toBeLessThanOrEqual(NUMBERS.PACK);
    // The Deep's bosses are its own: the boss's wins, which its deeds are paced by, are not counted.
    expect(expeditionsOf(state).wins).toEqual({});
    const again = descend(state);
    expect(deepOf(again.state).run).toMatchObject({ from: waystoneOf(d.deepest), depth: waystoneOf(d.deepest) });
  });

  it('holds two omens a week, the same for everyone, and different weeks bring others', () => {
    const weeks = ['2026-11-23', '2026-11-30', '2026-12-07', '2026-12-14'];
    const drawn = weeks.map((w) => omensOf(w).map((o) => o.id));
    for (const pair of drawn) expect(new Set(pair).size).toBe(2);
    expect(new Set(drawn.map((p) => p.join())).size).toBeGreaterThan(1);
  });
});
