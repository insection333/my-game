// A boss is a fight like any other for what lifts a fight's pay (session 160). An Edict of Harvest ("+10%
// gold from fights"), the style's spoils perks and its Path of Bounty lifted every foe's gold but a boss's,
// and an Edict or Path of Fortune ("Rare and Legendary finds likelier") every foe's finds but a boss's, whose
// finds are Rare and Legendary alone.
import { HOUR, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { bossFindChance } from '../src/expeditions/boss.ts';
import { fighterOf } from '../src/shared/combat/state.ts';
import { BOSSES } from '../src/shared/expeditions/data.ts';
import { engine, fighterAt, T0 } from './helpers/expedition.ts';

const troll = BOSSES.find((b) => b.id === 'troll-chief')!;
const start = { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: 'troll-chief' } } as const;
const withEdict = (s: State, edict: string): State => ({
  ...s,
  features: { ...s.features, castle: { edict, pct: 10, until: T0 + 48 * HOUR } },
});
const goldOf = (s: State) => {
  const a = engine.command(s, T0, start, seeded(7)).state;
  const out = engine.advance({ ...a, lastSeen: T0 + HOUR }, T0 + HOUR, seeded(7));
  const e = out.events.find((x) => x.type === 'bossFought');
  return { said: e?.type === 'bossFought' ? e.gold : -1, paid: (out.state.items.gold ?? 0) - (s.items.gold ?? 0) };
};

describe('a boss beaten', () => {
  it('pays its gold lifted by the spoils perks and an Edict of Harvest, and says what it paid', () => {
    const fighter = fighterAt('march', 7);
    const spoils = 1 + fighterOf(fighter, troll)!.perks.spoils / 100;
    expect(spoils).toBeGreaterThan(1);
    const plain = goldOf(fighter);
    const harvest = goldOf(withEdict(fighter, 'harvest'));
    expect(plain.paid).toBe(Math.round(troll.gold * spoils));
    expect(harvest.paid).toBe(Math.round(troll.gold * spoils * 1.1));
    expect(harvest.said).toBe(harvest.paid);
  });

  it('finds more likely under an Edict of Fortune', () => {
    const plain = fighterAt('march', 7);
    const fortune = withEdict(plain, 'fortune');
    const chance = (s: State) => bossFindChance(s, fighterOf(s, troll)!, [], T0);
    expect(chance(fortune) / chance(plain)).toBeCloseTo(1.1, 5);
  });
});
