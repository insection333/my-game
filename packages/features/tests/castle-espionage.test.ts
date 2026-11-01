// Castle Clash's espionage (SPEC.md section 4D): a caught spy compromises only its own pair and pays the
// defender war marks, never a buff for everyone; a lapsed debuff leaves no immunity (only a genuine siege
// consuming it does, castle-siege test); and every limit is refused before anything is spent.
import { DECREES } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import {
  decreeIndex,
  newCastle,
  pairOf,
  runMission,
  spyChance,
  spyCosts,
  spyRefusal,
  stealth,
  syncCastle,
  missionOf,
  type Castle,
} from '../src/shared/castle/index.ts';

const H = 3_600_000;
const T0 = (() => {
  let t = Date.UTC(2026, 10, 2);
  while (DECREES[decreeIndex(t)].id !== 'open-coffers') t += 604_800_000;
  return t;
})();
const lord = (id: string, level: number, extra: Partial<Castle> = {}): Castle => {
  const base = newCastle(id, T0 - 72 * H);
  const levels = Object.fromEntries(Object.keys(base.levels).map((k) => [k, level])) as Castle['levels'];
  return syncCastle({ ...base, levels, activeAp: 240, ...extra }, T0).castle;
};
const CAUGHT = 0.999;
const SPIED = 0;

describe('Castle Clash espionage', () => {
  it('keeps the chance between 10% and 90%: equal castles at level 10 near 43% (the outriders add 10% stealth)', () => {
    expect(spyChance(lord('a', 10), lord('d', 10), T0)).toBeCloseTo(0.5 + 0.35 * Math.log((60 * 1.1) / 80), 12);
    expect(spyChance(lord('a', 100), lord('d', 1), T0)).toBe(0.9);
    expect(spyChance(lord('a', 1), lord('d', 100), T0)).toBe(0.1);
  });

  it('compromises only the caught pair: a quarter less stealth, three stacks at most, gone after 12 hours', () => {
    let att = lord('a', 10);
    const def = lord('d', 10);
    const before = stealth(att, 'd', T0);
    let marks = 0;
    for (let i = 0; i < 3; i++) {
      const r = runMission(att, def, 'poison', T0 + i, CAUGHT);
      expect(r.success).toBe(false);
      marks += r.defenderMarks;
      att = r.attacker;
    }
    expect(marks).toBe(6);
    expect(pairOf(att, 'd', T0 + 10).cn).toBe(3);
    expect(stealth(att, 'd', T0 + 10)).toBeCloseTo(before * 0.75 ** 3, 9);
    // The same attacker against another castle, and another attacker against this one, are untouched.
    expect(stealth(att, 'e', T0 + 10)).toBeCloseTo(before, 9);
    expect(stealth(lord('b', 10), 'd', T0 + 10)).toBeCloseTo(before, 9);
    expect(pairOf(att, 'd', T0 + 13 * H).cn).toBe(0);
  });

  it('gives the defender nothing but war marks when a spy is caught: no debuff, no immunity, no buff', () => {
    const def = lord('d', 10);
    const r = runMission(lord('a', 10), def, 'sabotage', T0, CAUGHT);
    expect(r.defender).toEqual({ ...def, warMarks: def.warMarks + 2, warMarksEarned: def.warMarksEarned + 2 });
  });

  it('allows three missions per pair a day, refused before anything is spent', () => {
    let att = lord('a', 10);
    const def = lord('d', 10);
    for (let i = 0; i < 3; i++) att = runMission(att, def, 'scout', T0 + i, SPIED).attacker;
    expect(spyRefusal(att, def, 'scout', T0 + 5)).toBe('pairLimit');
    expect(spyRefusal(att, lord('e', 10), 'scout', T0 + 5)).toBeNull();
    expect(spyRefusal(att, def, 'scout', T0 + 25 * H)).toBeNull();
  });

  it('pins a scouted garrison for 15 minutes and its treasury for 30', () => {
    const r = runMission(lord('a', 10), lord('d', 10), 'scout', T0, SPIED);
    expect(r.defender.reconLockdownUntil).toBe(T0 + 15 * 60_000);
    expect(r.defender.withdrawLockdownUntil).toBe(T0 + 30 * 60_000);
  });

  it('stacks poison twice at most, sabotage and forged orders once, and refuses a castle that is full or immune', () => {
    let def = lord('d', 10);
    for (let i = 0; i < 2; i++) def = runMission(lord(`a${i}`, 10), def, 'poison', T0, SPIED).defender;
    expect(def.debuffs).toEqual([{ kind: 'poison', stacks: 2, until: T0 + 4 * H }]);
    expect(spyRefusal(lord('b', 10), def, 'poison', T0)).toBe('full');
    def = runMission(lord('c', 10), def, 'sabotage', T0, SPIED).defender;
    expect(spyRefusal(lord('b', 10), def, 'sabotage', T0)).toBe('full');
    expect(spyRefusal(lord('b', 10), { ...def, immunities: { forge: T0 + H } }, 'forge', T0)).toBe('immune');
    expect(spyRefusal(lord('b', 10), { ...def, shieldUntil: T0 + H }, 'scout', T0)).toBe('shielded');
  });

  it('clears a debuff that lapses by time with no immunity at all', () => {
    const def = runMission(lord('a', 10), lord('d', 10), 'forge', T0, SPIED).defender;
    const later = syncCastle(def, T0 + 3 * H).castle;
    expect(later.debuffs).toEqual([]);
    expect(later.immunities).toEqual({});
    expect(spyRefusal(lord('b', 10), later, 'forge', T0 + 3 * H)).toBeNull();
  });

  it('scales the bribe to the stronger castle', () => {
    const weak = lord('a', 5);
    const strong = lord('d', 40);
    const scout = missionOf('scout')!;
    expect(spyCosts(weak, strong, scout, T0).gold).toBe(spyCosts(strong, weak, scout, T0).gold);
    expect(spyCosts(weak, strong, scout, T0).gold).toBe(Math.round(50 * strong.rating));
  });
});
