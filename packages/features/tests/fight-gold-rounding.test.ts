// A small lift on a small purse is paid, on average (session 161). A won fight's gold was rounded to the
// coin, so against the first foes the lifts came and went by rounding alone: a goblin slinger's 4 gold at
// the first spoils perk's +6% came to 4.24 and was paid as 4, at +12% to 4.48 and still 4, and an Edict of
// Harvest's +10% on top paid 5, a quarter more; a hollow rat's 5 gold jumped from 5 to 6 between the first
// and second perks. The Combat page counted each lift as it is. The part of a coin is now paid by chance,
// so the gold a day brings is what the page says.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type ActionContext, type GameEvent, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { combatData } from '../src/index.ts';
import { spoils } from '../src/shared/combat/spoils.ts';
import { fighterOf } from '../src/shared/combat/state.ts';

const T0 = Date.UTC(2026, 10, 20, 9);
const fighterAt = (level: number, edict: number): State => ({
  ...newState(3, T0),
  skills: { melee: { xp: XP_TABLE[level] }, hitpoints: { xp: XP_TABLE[level] } },
  items: { 'copper-sword': 1 },
  features: {
    combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null },
    castle: { edict: 'harvest', pct: edict, until: T0 + 3_600_000 },
  },
});

/** Gold a win pays on average over many wins, against what the lifts make of the foe's gold. */
function perWin(level: number, edict: number, foe: string) {
  const state = fighterAt(level, edict);
  const f = combatData.foeById(foe)!;
  const p = fighterOf(state, f)!;
  let r = 11;
  const ctx: ActionContext = {
    state,
    at: T0,
    startedAt: T0,
    lane: 'combat',
    fireBurning: false,
    fireMinutes: 0,
    roll: () => (r = (r * 16807) % 2147483647) / 2147483647,
    emit: (_e: GameEvent) => undefined,
  };
  const wins = 4000;
  for (let i = 0; i < wins; i++) spoils(ctx, p, f);
  return { paid: (state.items.gold ?? 0) / wins, said: f.gold * (1 + p.perks.spoils / 100) * (1 + edict / 100) };
}

describe("a won fight's gold", () => {
  it('pays its lifts on average, however small the purse', () => {
    for (const [level, edict, foe] of [
      [12, 0, 'goblin-slinger'],
      [12, 10, 'goblin-slinger'],
      [5, 0, 'hollow-rat'],
      [20, 10, 'hollow-rat'],
    ] as const) {
      const { paid, said } = perWin(level, edict, foe);
      expect(paid / said, `${foe} at Melee ${level}, edict ${edict}%`).toBeCloseTo(1, 1);
    }
  });
});
