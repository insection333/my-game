// A battle's hosts as figures (session 168): nine to a side, shared out by the formation's shares by their
// largest remainders, a share above nothing keeping a figure, each troop at its evolution.
import { describe, expect, it } from 'vitest';
import { figuresOf, hostOf, levelOfRating } from '../src/pages/castle/hosts.ts';

describe('the hosts as figures', () => {
  it('shares nine figures out by the formation', () => {
    expect(figuresOf([34, 33, 33])).toEqual([3, 3, 3]);
    expect(figuresOf([60, 20, 20])).toEqual([5, 2, 2]);
    expect(figuresOf([30, 25, 45])).toEqual([3, 2, 4]);
    expect(figuresOf([100, 0, 0])).toEqual([9, 0, 0]);
    expect(figuresOf([0.9, 0.05, 0.05])).toEqual([7, 1, 1]);
    for (const shares of [
      [1, 1, 1],
      [50, 50, 0],
      [5, 90, 5],
      [0.2, 0.3, 0.5],
    ])
      expect(figuresOf(shares).reduce((a, b) => a + b, 0)).toBe(9);
  });

  it('draws each troop at its evolution', () => {
    const host = hostOf([1, 1, 1], { vanguard: 1, outriders: 6, siege: 22 });
    expect(host.map((r) => r.icon)).toEqual(['levy-spearmen', 'lancer-dragoons', 'arcane-conflux-engines']);
  });

  it('reckons a lord’s level from their rating as a stronghold’s', () => {
    expect(levelOfRating(540)).toBeCloseTo(1, 5);
    expect(levelOfRating(1)).toBe(1);
  });
});
