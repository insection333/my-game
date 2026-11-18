// What a dig of the deep foundations gives (session 143): the Citadel said "Depth 1: the edict and AP
// ×1.02", a multiplier to puzzle over and nothing of what the next dig adds. It now says the lift the
// foundations give now, and what one more dig brings: the lift to both, and gold the vault keeps.
import { ECONOMY, SINKS } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { excavationGain, idleMultiplier, newCastle } from '../src/shared/castle/index.ts';

const at = (depth: number) => ({ ...newCastle('a', 0), excavationDepth: depth });

describe('what a dig gives', () => {
  it('says the lift now and what the next dig adds, in percent', () => {
    const g = excavationGain(at(1));
    expect(g.now).toBeCloseTo((idleMultiplier(at(1)) - 1) * 100, 9);
    expect(g.next).toBeCloseTo((idleMultiplier(at(2)) - idleMultiplier(at(1))) * 100, 9);
    expect(g.vault).toBe(ECONOMY.VAULT_FLAT_PER_DEPTH);
  });

  it('gives each dig less than the one before, never nothing', () => {
    const gains = [0, 1, 4, 9, 25].map((d) => excavationGain(at(d)).next);
    for (let i = 1; i < gains.length; i++) expect(gains[i]).toBeLessThan(gains[i - 1]);
    expect(excavationGain(at(0)).now).toBe(0);
    expect(excavationGain(at(0)).next).toBeCloseTo(SINKS.EXCAVATION_MULT_SLOPE * 100, 9);
  });
});
