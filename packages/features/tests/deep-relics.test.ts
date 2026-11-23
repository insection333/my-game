// The Deep's relics (session 215): bought with marks, a rank at a time with no last rank, each costing a
// little more than the one before; they carry more meals, soften the Deep's foes and harden blows there, and nowhere
// else, so the year's pacing is untouched.
import type { State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { FOES } from '../src/shared/combat/data.ts';
import { oddsFor } from '../src/shared/combat/odds.ts';
import { DEEP_RELIC, deepRank, deepRelicCost, inTheDeep } from '../src/shared/expeditions/deep-relics.ts';
import { expeditionsOf, setExpeditions } from '../src/shared/expeditions/state.ts';
import { packSize } from '../src/expeditions/deep.ts';
import { raiseDeepRelic, deepRelicRows } from '../src/expeditions/deep-relics.ts';
import { relicRaisedWords } from '../src/expeditions/relics-view.ts';
import { fighterOfLevel } from './helpers/expedition.ts';

const withMarks = (s: State, marks: number) => {
  const out = structuredClone(s);
  setExpeditions(out, { ...expeditionsOf(out), marks });
  return out;
};
const raise = (s: State, id: string, times: number) => {
  for (let i = 0; i < times; i++) s = raiseDeepRelic(s, id).state;
  return s;
};

describe("the Deep's relics", () => {
  it('cost marks, 3% more each rank, and refuse without them', () => {
    expect([0, 1, 2, 10, 50].map(deepRelicCost)).toEqual([40, 41, 42, 54, 175]);
    const s = withMarks(fighterOfLevel(99, 1, 'melee'), 100);
    const once = raiseDeepRelic(s, 'deep-satchel');
    expect(once.result).toEqual({ ok: true });
    expect(expeditionsOf(once.state).marks).toBe(60);
    expect(deepRank(once.state, 'deep-satchel')).toBe(1);
    expect(once.events[0]).toMatchObject({ type: 'relicRaised', relic: 'deep-satchel', rank: 1 });
    expect(relicRaisedWords('deep-satchel', 1)).toMatchObject({ title: "Delver's satchel raised to rank 1" });
    expect(raiseDeepRelic(withMarks(s, 39), 'deep-edge').result).toEqual({ ok: false, reason: 'marks' });
    expect(raiseDeepRelic(s, 'hearthstone').result).toEqual({ ok: false, reason: 'unknown' });
  });

  it("carry more meals, soften the Deep's foes and harden blows there", () => {
    const s = raise(withMarks(fighterOfLevel(99, 1, 'melee'), 10_000), 'deep-satchel', 5);
    expect(packSize(s)).toBe(30 + 5 * DEEP_RELIC.MEALS);
    const golem = FOES.find((f) => f.id === 'obsidian-golem')!;
    const lit = raise(raise(s, 'deep-lantern', 10), 'deep-edge', 10);
    const deep = inTheDeep(lit, golem);
    expect(deep.maxHit).toBe(Math.round(golem.maxHit * 0.98 ** 10));
    expect(deep.hp).toBe(Math.round(golem.hp / 1.03 ** 10));
    expect(deepRelicRows(lit).map((r) => r.gives)).toEqual([
      "10 more meals in a descent's pack",
      'Foes in the Deep hit 18.3% softer',
      'Your blows land 34.4% harder in the Deep',
    ]);
  });

  it('change nothing outside the Deep', () => {
    const s = fighterOfLevel(99, 1, 'melee');
    const lit = raise(raise(withMarks(s, 100_000), 'deep-lantern', 20), 'deep-edge', 20);
    const golem = FOES.find((f) => f.id === 'obsidian-golem')!;
    expect(oddsFor(lit, golem)).toEqual(oddsFor(s, golem));
  });
});
