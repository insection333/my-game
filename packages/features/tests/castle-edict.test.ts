// Castle Clash in the rest of the game (DESIGN.md section 7): a Sovereign Edict mirrored into the save
// lifts XP (Vigor) and fight gold (Harvest) while it lasts, and nothing once its `until` passes; the
// mirror a castle gives is cut short by upkeep, and lasts while upkeep is paused.
import { createEngine, HOUR, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';
import {
  callAwaits,
  mirrorFor,
  mirrorOf,
  newCastle,
  requiredTreasury,
  type CastleMirror,
} from '../src/shared/castle/index.ts';
import { fighterAt, T0 } from './helpers/expedition.ts';

const engine = createEngine(actionRegistry(FEATURES, () => true));
const withEdict = (s: State, m: CastleMirror): State => ({ ...s, features: { ...s.features, castle: m } });

/** A day of one action, hour by hour. */
function day(start: State, action: { feature: string; id: string }, lane: 'gathering' | 'combat' = 'gathering') {
  let s = engine.command(start, T0, { type: 'start', lane, action }, seeded(1)).state;
  for (let at = T0 + HOUR; at <= T0 + 24 * HOUR; at += HOUR)
    s = engine.advance({ ...s, lastSeen: at }, at, seeded(1)).state;
  return s;
}

describe('a Sovereign Edict in the rest of the game', () => {
  it('lifts XP in every skill by its percent (Vigor), and not at all once it has run out', () => {
    const pine = { feature: 'woodcutting', id: 'pine-tree' };
    const plain = day(newState(4, T0), pine).skills.woodcutting.xp;
    const vigor = day(withEdict(newState(4, T0), { edict: 'vigor', pct: 10, until: T0 + 48 * HOUR }), pine).skills
      .woodcutting.xp;
    const spent = day(withEdict(newState(4, T0), { edict: 'vigor', pct: 10, until: T0 }), pine).skills.woodcutting.xp;
    expect(vigor / plain).toBeGreaterThan(1.09);
    expect(vigor / plain).toBeLessThan(1.1);
    expect(spent).toBe(plain);
  });

  it('lifts fight gold (Harvest), and XP not at all', () => {
    const fighter = fighterAt('march');
    const rat = { feature: 'combat', id: 'hollow-rat' };
    const plain = day(fighter, rat, 'combat');
    const harvest = day(withEdict(fighter, { edict: 'harvest', pct: 10, until: T0 + 48 * HOUR }), rat, 'combat');
    const gold = (s: State) => (s.items.gold ?? 0) - (fighter.items.gold ?? 0);
    expect(gold(harvest) / gold(plain)).toBeGreaterThan(1.07);
    expect(gold(plain)).toBeGreaterThan(0);
    expect(harvest.skills.magic.xp).toBe(plain.skills.magic.xp);
  });

  it('reads no edict from a save without one or with a damaged part', () => {
    expect(mirrorOf(newState(1, T0)).edict).toBeNull();
    expect(mirrorOf({ ...newState(1, T0), features: { castle: { edict: 'gold-rain', pct: 99 } } }).edict).toBeNull();
  });

  it('ends the mirror when upkeep would take the treasury under the requirement, and keeps it while upkeep is paused', () => {
    const today = new Date(T0).toISOString().slice(0, 10);
    const base = { ...newCastle('a', T0), edict: 'vigor', lastCtaDateUtc: today };
    const req = requiredTreasury(base, 0);
    // At 1.02 × the requirement, 2% a day crosses it in about a day: well before the 48-hour pause.
    const thin = mirrorFor({ ...base, treasury: Math.ceil(req * 1.02) }, 0, T0);
    expect(thin.pct).toBeGreaterThan(5);
    expect((thin.until - T0) / (24 * HOUR)).toBeCloseTo(Math.log(1 / 1.02) / Math.log(0.98), 1);
    // A deep treasury outlasts the pause: the edict holds until the next Call to arms rewrites it.
    expect(mirrorFor({ ...base, treasury: req * 3 }, 0, T0).until).toBe(Number.MAX_SAFE_INTEGER);
    expect(mirrorFor({ ...base, treasury: req - 1 }, 0, T0)).toMatchObject({ edict: null, pct: 0, until: 0 });
  });
  it("carries the castle's standing for the deeds, edict or none", () => {
    const c = { ...newCastle('lord', T0), incursionTier: 8, warMarksEarned: 120, relics: { 'aegis-shard': 2 } };
    expect(mirrorFor(c, 0, T0).standing).toEqual({
      level: 1,
      taken: 7,
      marks: 120,
      relics: 2,
      studies: 0,
      called: null,
    });
    // The Hearth's reminder: until today's call is answered.
    const state = newState(1, T0);
    state.features.castle = mirrorFor(c, 0, T0);
    expect(callAwaits(state, T0)).toBe(true);
    state.features.castle = mirrorFor({ ...c, lastCtaDateUtc: new Date(T0).toISOString().slice(0, 10) }, 0, T0);
    expect(callAwaits(state, T0)).toBe(false);
    expect(callAwaits(newState(1, T0), T0)).toBe(false);
  });
});
