// Session 271: a fight ends when the foe falls or the fighter retreats, so a fighter who cannot be hurt against a
// foe of vast health (the Deep's Lantern bought alone, its depths compounding a foe's health) would play millions
// of swings on the server's one thread. A fight past MAX_SWINGS is given up as a retreat.
import { describe, expect, it } from 'vitest';
import { seeded } from '@idle-clash/kernel';
import { fight, MAX_SWINGS } from '../src/shared/combat/fight.ts';
import { fighterOf, mealsOf } from '../src/shared/combat/state.ts';
import { bossById } from '../src/shared/expeditions/data.ts';
import { fighterOfLevel } from './helpers/expedition.ts';

describe('a fight no side can end', () => {
  it('is given up as a retreat within its bound, quickly', () => {
    const s = fighterOfLevel(99, 1, 'magic');
    const boss = bossById('barrow-king')!;
    const vast = { ...boss, hp: 1e12, maxHit: 1, trait: undefined };
    const p = fighterOf(s, vast)!;
    const t0 = performance.now();
    const r = seeded(3);
    let i = 0;
    const f = fight(p, vast, () => r('x', i++), 1e9, mealsOf(s));
    expect(performance.now() - t0).toBeLessThan(2_000);
    expect(f.retreated).toBe(true);
    expect(f.seconds).toBeLessThanOrEqual((MAX_SWINGS + 1) * 3);
    // An ordinary fight is untouched.
    const won = fight(p, boss, () => r('y', i++), 1e9, mealsOf(s));
    expect(won.retreated).toBe(false);
  });
});
