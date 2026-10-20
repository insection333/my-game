// Combat: gear is worn only with its level and only if owned; a fight is decided by its seed, so the
// time it takes and the way it ends agree; a defeat pays, and a retreat loses nothing but the food
// eaten in that fight, stopping the lane with the reason.
import { formatStop, XP_TABLE } from '@idle-clash/content';
import { createEngine, HOUR, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { remove, wear } from '../src/combat/gear.ts';
import { combatData, actionRegistry, FEATURES } from '../src/index.ts';
import { fight, odds } from '../src/shared/combat/fight.ts';
import { combatOf, fighterOf } from '../src/shared/combat/state.ts';

const T0 = Date.UTC(2026, 9, 21, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const rng = seeded(8);
const foe = (id: string) => combatData.foeById(id)!;
const fighter = (
  levels: Record<string, number>,
  items: Record<string, number>,
  worn: Record<string, string>,
): State => ({
  ...newState(8, T0),
  skills: Object.fromEntries(Object.entries(levels).map(([k, l]) => [k, { xp: XP_TABLE[l] }])),
  items,
  features: { combat: { worn, health: null, healthAt: 0, retreated: null } },
});

describe('gear', () => {
  const s = (levels: Record<string, number>, items: Record<string, number>) => fighter(levels, items, {});

  it('wears a weapon owned at its level, and takes it off again', () => {
    const worn = wear(s({ melee: 1 }, { 'copper-sword': 1 }), 'copper-sword');
    expect(worn.result).toEqual({ ok: true });
    expect(combatOf(worn.state).worn.weapon).toBe('copper-sword');
    expect(combatOf(remove(worn.state, 'weapon').state).worn.weapon).toBeUndefined();
  });

  it('refuses gear not owned, below its level, or not gear at all', () => {
    expect(wear(s({ melee: 1 }, {}), 'copper-sword').result).toMatchObject({ reason: { code: 'notOwned' } });
    expect(wear(s({ magic: 5 }, { 'bronze-staff': 1 }), 'bronze-staff').result).toEqual({
      ok: false,
      reason: { code: 'levelTooLow', detail: { skill: 'magic', level: 10 } },
    });
    expect(wear(s({}, { 'pine-logs': 3 }), 'pine-logs').result).toMatchObject({ reason: { code: 'notGear' } });
  });
});

describe('a fight', () => {
  const p = fighterOf(fighter({ melee: 5 }, { 'copper-sword': 1 }, { weapon: 'copper-sword' }), foe('hollow-rat'))!;

  it('plays the same with the same seed, and differently with another', () => {
    const play = (seed: number) => {
      const r = seeded(seed);
      let i = 0;
      return fight(p, foe('hollow-rat'), () => r('fight', i++), 300, []);
    };
    expect(play(1)).toEqual(play(1));
    expect([2, 3, 4, 5].some((n) => play(n).seconds !== play(1).seconds)).toBe(true);
  });

  it('eats the best food below half health, and retreats below 20% once it has none', () => {
    const r = seeded(9);
    let i = 0;
    const f = fight(p, foe('hill-troll'), () => r('fight', i++), 300, [{ item: 'bread', heals: 140, count: 2 }]);
    expect(f.retreated).toBe(true);
    expect(f.eaten).toEqual({ bread: 2 });
    expect(f.health).toBeLessThan(60);
  });

  it('calls a foe Easy that the player beats without eating, Fair at first, Costly when it eats, and Too strong with no food', () => {
    const bread = { item: 'bread', heals: 140 };
    const strong = fighter({ melee: 20, hitpoints: 20 }, { 'copper-sword': 1 }, { weapon: 'copper-sword' });
    expect(odds(fighterOf(strong, foe('hollow-rat'))!, foe('hollow-rat'), bread).verdict).toBe('easy');
    expect(odds(p, foe('hollow-rat'), bread).verdict).toBe('fair');
    expect(odds(p, foe('hill-troll'), bread).verdict).toBe('costly');
    expect(odds(p, foe('hill-troll'), null).verdict).toBe('tooStrong');
  });
});

describe('fighting in the Combat lane', () => {
  const rat = { feature: 'combat', id: 'hollow-rat' };
  const troll = { feature: 'combat', id: 'hill-troll' };

  it('pays style and Hitpoints XP, gold and the drop for each defeat', () => {
    let s = fighter({ melee: 5 }, { 'copper-sword': 1, bread: 10 }, { weapon: 'copper-sword' });
    s = engine.command(s, T0, { type: 'start', lane: 'combat', action: rat }, rng).state;
    s = engine.advance(s, T0 + HOUR, rng).state;
    expect(s.items.gold).toBeGreaterThan(5 * 50);
    expect(s.items['copper-ore']).toBeGreaterThan(50);
    expect(s.skills.melee.xp).toBeGreaterThan(XP_TABLE[5]);
    expect(s.skills.hitpoints.xp).toBeGreaterThan(0);
    expect(s.lanes.combat.current?.action).toEqual(rat);
  });

  it('refuses to fight without a weapon, and a foe above the Hitpoints level', () => {
    const bare = fighter({}, {}, {});
    expect(engine.command(bare, T0, { type: 'start', lane: 'combat', action: rat }, rng).result).toMatchObject({
      reason: { code: 'noWeapon' },
    });
    const armed = fighter({}, { 'copper-sword': 1 }, { weapon: 'copper-sword' });
    expect(engine.command(armed, T0, { type: 'start', lane: 'combat', action: troll }, rng).result).toEqual({
      ok: false,
      reason: { code: 'hitpointsTooLow', detail: { level: 27 } },
    });
  });

  it('retreats with nothing lost but the food eaten, and the lane says why', () => {
    const items = { 'copper-sword': 1, 'copper-helm': 1, bread: 3, gold: 40, 'pine-logs': 7 };
    let s = fighter({ melee: 5, hitpoints: 27 }, items, { weapon: 'copper-sword', helm: 'copper-helm' });
    s = engine.command(s, T0, { type: 'start', lane: 'combat', action: troll }, rng).state;
    const out = engine.advance(s, T0 + HOUR, rng);
    const stopped = out.events.find((e) => e.type === 'laneStopped');
    expect(stopped).toMatchObject({ lane: 'combat', reason: { code: 'retreated', detail: { foe: 'hill-troll' } } });
    if (stopped?.type === 'laneStopped')
      expect(formatStop(stopped.reason)).toBe('Retreated from the hill troll: out of food');
    // Just before the fight that ended in the retreat, and after it: only its food is gone.
    const before = engine.advance(s, stopped!.at - 1, rng).state;
    const { bread: _eaten, ...kept } = before.items;
    expect(out.state.items).toEqual(kept);
    expect(combatOf(out.state).worn).toEqual({ weapon: 'copper-sword', helm: 'copper-helm' });
    expect(out.state.lanes.combat.current).toBeNull();
  });
});
