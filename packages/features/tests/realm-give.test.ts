// Giving to the realm's work (session 218): gold, or all of a material held at its price; refused once the
// season's work stands finished, outside a season, or for what is not a material; the sheet offers round sums
// of gold and the materials worth most.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { give } from '../src/steading/realm-give.ts';
import { realmWorkView } from '../src/steading/realm-view.ts';
import { FEATURES } from '../src/registry.ts';

void FEATURES;
const IN2 = Date.UTC(2027, 0, 5, 12);
const mirror = (given: number) => ({
  season: 2,
  work: 'bridge' as const,
  needed: 40_000_000,
  given,
  mine: 0,
  givers: 1,
  finished: 0,
  thanks: null,
});
function rich(given = 0): State {
  const s = newState(3, IN2);
  s.items = { gold: 2_000_000, 'oak-logs': 500, bread: 10 };
  s.features.realmWork = mirror(given);
  return s;
}

describe("giving to the realm's work", () => {
  it('takes gold, or all of a material at its price, and says so as a gift of its worth', () => {
    const r = give(rich(), { gold: 100_000 }, IN2);
    expect(r.result).toEqual({ ok: true, worth: 100_000 });
    expect(r.state.items.gold).toBe(1_900_000);
    expect(r.events[0]).toMatchObject({ type: 'realmGiven', season: 2, work: 'bridge', worth: 100_000 });
    const logs = give(rich(), { item: 'oak-logs' }, IN2);
    expect(logs.state.items['oak-logs'] ?? 0).toBe(0);
    expect(logs.result.ok && logs.result.worth).toBeGreaterThan(0);
  });

  it('refuses a finished work, a day before the first season, more gold than held and what is not a material', () => {
    expect(give(rich(40_000_000), { gold: 10 }, IN2).result).toEqual({ ok: false, reason: 'finished' });
    expect(give(rich(), { gold: 10 }, Date.UTC(2026, 9, 1)).result).toEqual({ ok: false, reason: 'noSeason' });
    expect(give(rich(), { gold: 3_000_000 }, IN2).result).toEqual({ ok: false, reason: 'short' });
    expect(give(rich(), { item: 'bread' }, IN2).result).toEqual({ ok: false, reason: 'notMaterial' });
  });

  it('offers round sums of the purse and the materials held, and nothing to give once finished', () => {
    const v = realmWorkView(rich(8_000_000), IN2)!;
    expect(v).toMatchObject({ name: 'The bridge over the Fen', stage: 1, standing: 'Stage 1 of 5', finished: false });
    expect(v.gold.map((g) => g.label)).toEqual(['Give 20,000 gold', 'Give 200K gold', 'Give 1M gold']);
    expect(v.materials.map((m) => m.item)).toEqual(['oak-logs']);
    const done = realmWorkView(rich(40_000_000), IN2)!;
    expect(done).toMatchObject({ standing: 'Finished', gold: [], materials: [] });
    expect(realmWorkView(newState(3, IN2), IN2)).toBeNull();
  });
});
