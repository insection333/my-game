// The war between lords, sooner and in a small realm (session 137, the castle review's second stage).
// Lords opened at an average castle level of 5, which a steady player reaches about day 50: a test among
// friends of a few weeks never met another lord. They now open at level 3 or two weeks after the castle
// is raised, whichever comes first. And lords were matched only from 0.75 to 1.35 of your rating, so in a
// realm of a handful of castles the list stood empty: it now reaches further, a step at a time, until it
// finds three.
import { SIEGE, UNLOCKS } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { lordsInReach, lordsOpen, lordsOpenAt, newCastle, type Castle } from '../src/shared/castle/index.ts';

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 10, 18, 9);
const at = (level: number, raised = T0): Castle => {
  const c = newCastle('a', raised);
  return { ...c, levels: Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as Castle['levels'] };
};

describe('when lords open', () => {
  it('opens at an average level of 3', () => {
    expect(UNLOCKS.LORDS_AVG_LEVEL).toBe(3);
    expect(lordsOpen(at(2), T0)).toBe(false);
    expect(lordsOpen(at(3), T0)).toBe(true);
  });

  it('opens two weeks after the castle is raised, at any level', () => {
    expect(lordsOpen(at(1), T0 + 14 * DAY - 1)).toBe(false);
    expect(lordsOpen(at(1), T0 + 14 * DAY)).toBe(true);
    expect(lordsOpenAt(at(1))).toBe(T0 + 14 * DAY);
  });
});

describe('lords in reach', () => {
  const lords = (...ratings: number[]) => ratings.map((rating, i) => ({ id: `l${i}`, rating }));

  it('keeps to the near bracket when it holds enough lords', () => {
    const r = lordsInReach(1000, lords(800, 950, 1200, 1500, 400));
    expect(r.reach).toBe(0);
    expect(r.lords.map((l) => l.rating)).toEqual([800, 950, 1200]);
  });

  it('reaches a step further when too few stand near, and no further than it must', () => {
    const r = lordsInReach(1000, lords(950, 1550, 620, 2500, 300));
    expect(r.reach).toBe(1);
    expect(r.lords.map((l) => l.rating).sort((a, b) => a - b)).toEqual([620, 950, 1550]);
  });

  it('reaches to half and twice your rating at most', () => {
    const r = lordsInReach(1000, lords(1900, 520, 2100, 450));
    expect(r.reach).toBe(SIEGE.BRACKET_STEPS.length - 1);
    expect(r.lords.map((l) => l.rating).sort((a, b) => a - b)).toEqual([520, 1900]);
    expect(lordsInReach(1000, []).lords).toEqual([]);
  });
});

describe('lords shielded today', () => {
  it('counts them in the near bracket, so a busy bracket does not spill onto the far weaker', () => {
    const lords = [
      { id: 'a', rating: 950, shielded: true },
      { id: 'b', rating: 1050, shielded: true },
      { id: 'c', rating: 1100, shielded: false },
      { id: 'far', rating: 560, shielded: false },
    ];
    const r = lordsInReach(1000, lords, (l) => !l.shielded);
    expect(r.reach).toBe(0);
    expect(r.lords.map((l) => l.id)).toEqual(['c']);
  });
});
