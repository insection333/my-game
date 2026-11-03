// The arena (session 42): the Combat page plays out the very fight the engine settles. Logging the
// swings changes nothing; the swings the page shows add up to what the fight dealt and took, fall
// within its time, and end where it ends: the foe at nothing, or the fighter in retreat.
import { XP_TABLE } from '@idle-clash/content';
import { createEngine, HOUR, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { arenaOf } from '../src/combat/arena.ts';
import { actionRegistry, combatData, FEATURES } from '../src/index.ts';
import { CRIT_SHARE, fight, type Swing } from '../src/shared/combat/fight.ts';
import { fighterOf } from '../src/shared/combat/state.ts';

const T0 = Date.UTC(2026, 10, 3, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const fighter = (levels: Record<string, number>, items: Record<string, number>): State => ({
  ...newState(42, T0),
  skills: Object.fromEntries(Object.entries(levels).map(([k, l]) => [k, { xp: XP_TABLE[l] }])),
  items,
  features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
});
const sum = (xs: Swing[], by: 'you' | 'foe') => xs.reduce((a, s) => a + (s.by === by && s.hit ? s.damage : 0), 0);

describe('the arena', () => {
  it('goes the same with the log as without it, for many seeds', () => {
    const s = fighter({ melee: 20, hitpoints: 15 }, { 'copper-sword': 1, bread: 5 });
    const foe = combatData.foeById('orc-raider')!;
    const p = fighterOf(s, foe)!;
    for (let seed = 1; seed < 200; seed++) {
      const play = (log?: (x: Swing) => void) => {
        const r = seeded(seed);
        let i = 0;
        return fight(p, foe, () => r('fight', i++), 200, [{ item: 'bread', heals: 60, count: 3 }], {}, log);
      };
      const swings: Swing[] = [];
      expect(play((x) => swings.push(x))).toEqual(play());
      const f = play();
      expect(sum(swings, 'you')).toBeCloseTo(f.dealt, 1);
      expect(sum(swings, 'foe')).toBeCloseTo(f.taken, 1);
      expect(swings.every((x) => x.t > 0 && x.t <= f.seconds)).toBe(true);
      const last = swings.at(-1)!;
      if (f.retreated) expect(last.foeHp).toBeGreaterThan(0);
      else expect(swings.filter((x) => x.by === 'you').at(-1)!.foeHp).toBeLessThanOrEqual(0);
      expect(swings.filter((x) => x.by === 'meal').length).toBe(Object.values(f.eaten).reduce((a, b) => a + b, 0));
    }
  });

  it('plays the fight the Combat lane is in, lasting as long as the lane says', () => {
    let s = fighter({ melee: 5 }, { 'copper-sword': 1, bread: 10 });
    const rng = seeded(9);
    s = engine.command(
      s,
      T0,
      { type: 'start', lane: 'combat', action: { feature: 'combat', id: 'hollow-rat' } },
      rng,
    ).state;
    for (const at of [T0 + 1000, T0 + HOUR / 3, T0 + HOUR]) {
      s = engine.advance(s, at, rng).state;
      const arena = arenaOf(s)!;
      expect(arena.foe.id).toBe('hollow-rat');
      expect(arena.endsAt - arena.startedAt).toBe(Math.round(arena.fought.seconds * 1000));
      expect(arena.swings.length).toBeGreaterThan(0);
    }
  });

  it('is empty when the lane is not fighting', () => {
    expect(arenaOf(fighter({ melee: 5 }, {}))).toBeNull();
  });

  it('calls a hit critical only in the top tenth of what could be dealt', () => {
    const s = fighter({ melee: 40, hitpoints: 40 }, { 'copper-sword': 1 });
    const foe = combatData.foeById('hill-troll')!;
    const p = fighterOf(s, foe)!;
    const r = seeded(3);
    let i = 0;
    const swings: Swing[] = [];
    for (let k = 0; k < 40; k++)
      fight(
        p,
        foe,
        () => r('x', i++),
        1000,
        [],
        {},
        (x) => swings.push(x),
      );
    const hits = swings.filter((x): x is Exclude<Swing, { by: 'meal' }> => x.by === 'you' && x.hit);
    const crits = hits.filter((x) => x.crit);
    expect(crits.length).toBeGreaterThan(0);
    // About a tenth of hits, never most of them.
    expect(crits.length / hits.length).toBeLessThan(0.2);
    expect(CRIT_SHARE).toBe(0.9);
  });
});
