// A siege never takes what the defender's edict needs (session 137). With lords open two weeks in, the
// realm's simulation found a lord who plays one day in four raided on the day they came back: the raid left
// the treasury a coin under the edict's need, and their edict stood dark for the three days they were away.
// The edict is the castle's gift to the rest of the game; what a lord keeps above it, for a stronger edict,
// is what war puts at stake. The floor is the need and two days' upkeep (SIEGE.EDICT_FLOOR).
import { DECREES, SIEGE } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import {
  decreeIndex,
  edictBonusPct,
  launch,
  newCastle,
  raidableGold,
  requiredTreasury,
  resolveSiege,
  scoutReport,
  syncCastle,
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
  return syncCastle({ ...base, levels, activeAp: 240, edict: 'vigor', ...extra }, T0).castle;
};
const TOTAL = 300;
const LEVELS = { attacker: TOTAL, defender: TOTAL };

describe('the edict floor', () => {
  const need = requiredTreasury(lord('d', 8), TOTAL);
  const floor = Math.ceil(need * SIEGE.EDICT_FLOOR);

  it('leaves the edict powered after a decisive siege, and two days of upkeep later', () => {
    const def = lord('d', 8, { treasury: Math.round(need * 1.4) });
    const r = resolveSiege(launch(lord('a', 30), 'd', 20, T0), def, T0, 1, LEVELS);
    expect(r.outcome).toBe('decisive');
    expect(r.spoils.raided).toBeGreaterThan(0);
    expect(r.defender.treasury).toBeGreaterThanOrEqual(floor);
    const later = syncCastle(r.defender, T0 + 48 * H).castle;
    expect(edictBonusPct(later, TOTAL)).toBeGreaterThan(0);
  });

  it('takes nothing from a treasury at its floor, and says so in the scouting report', () => {
    const def = lord('d', 8, { treasury: floor });
    expect(raidableGold(def, T0, TOTAL)).toBe(0);
    expect(scoutReport(def, T0, TOTAL).raidable).toBe(0);
    const r = resolveSiege(launch(lord('a', 30), 'd', 20, T0), def, T0, 1, LEVELS);
    expect(r.spoils.raided).toBe(0);
    expect(r.defender.treasury).toBe(floor);
  });

  it('puts what is kept above the floor at stake, past the deep vault', () => {
    const def = lord('d', 8, { treasury: need * 3 });
    expect(raidableGold(def, T0, TOTAL)).toBe(Math.min(raidableGold(def, T0), def.treasury - floor));
    expect(raidableGold(def, T0, TOTAL)).toBeGreaterThan(0);
  });
});
