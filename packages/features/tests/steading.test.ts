// The steading: raising a work takes exactly its cost in gold and materials, a refusal changes nothing,
// and each work's gain reaches the place it names: gathering's yield, the artisan's ingredients, every
// skill's XP, the fighter's damage and food, and an expedition's marks.
import { createEngine, HOUR, newState, seeded, type GameEvent, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';
import { fighterOf } from '../src/shared/combat/state.ts';
import { FOES } from '../src/shared/combat/data.ts';
import { STAGES, stageCost, steadingOf, workById, WORKS } from '../src/shared/steading.ts';
import { raise } from '../src/steading/rules.ts';
import { steadingView } from '../src/steading/view.ts';
import { fighterAt, runOnce, T0 } from './helpers/expedition.ts';

const engine = createEngine(actionRegistry(FEATURES, () => true));
const raised = (s: State, stages: Record<string, number>): State => {
  const out = structuredClone(s);
  out.features.steading = { stages };
  return out;
};
const rich = (): State => ({
  ...newState(1, T0),
  items: { gold: 1e9, 'pine-logs': 1e5, 'copper-bar': 1e5, 'copper-ore': 1e5, perch: 1e5, 'spark-rune': 1e5 },
});

describe('raising a work', () => {
  it('takes exactly its gold and materials, and raises it a step', () => {
    const cost = stageCost(workById('training-yard')!, 1);
    const { state, result } = raise(rich(), 'training-yard');
    expect(result).toEqual({ ok: true, stage: 1 });
    expect(steadingOf(state).stages['training-yard']).toBe(1);
    expect(state.items.gold).toBe(1e9 - cost.gold);
    for (const i of cost.items) expect(state.items[i.item]).toBe(1e5 - i.count);
    expect(cost.items.map((i) => i.item)).toEqual(['copper-ore', 'pine-logs']);
  });

  it('refuses, changing nothing, when short of anything, unknown, or fully raised', () => {
    const poor = { ...rich(), items: { gold: 10, 'pine-logs': 1e5 } };
    expect(raise(poor, 'woodyard')).toEqual({
      state: poor,
      result: { ok: false, reason: 'short', item: 'gold' },
      events: [],
    });
    const noLogs = { ...rich(), items: { gold: 1e9 } };
    expect(raise(noLogs, 'woodyard').result).toEqual({ ok: false, reason: 'short', item: 'pine-logs' });
    expect(raise(rich(), 'castle').result).toEqual({ ok: false, reason: 'unknown' });
    expect(raise(raised(rich(), { woodyard: STAGES }), 'woodyard').result).toEqual({ ok: false, reason: 'top' });
  });

  it('shows what the next raising costs and whether each part is held', () => {
    const view = steadingView({ ...rich(), items: { gold: 1e9 } });
    expect(view.rows.map((r) => r.id)).toEqual(WORKS.map((w) => w.id));
    const yard = view.rows.find((r) => r.id === 'woodyard')!;
    expect(yard).toMatchObject({ standing: 'Not yet built', stage: 0 });
    expect(yard.next!.cost).toEqual([
      { label: '50,000 gold', enough: true, held: '1,000,000,000 held' },
      { label: 'Pine logs ×200', enough: false, held: '0 held' },
    ]);
    expect(yard.next!.affordable).toBe(false);
    expect(yard.ready).toBe(false);
    expect(steadingView(rich()).rows.find((r) => r.id === 'woodyard')!.ready).toBe(true);
  });

  it("opens on the Hearth once the first work's gold is held, and stays open once one is built", () => {
    const gold = stageCost(WORKS[0], 1).gold;
    const at = (n: number) => ({ ...newState(1, T0), items: { gold: n } });
    expect(steadingView(newState(1, T0)).open).toBe(false);
    expect(steadingView(at(gold - 1)).open).toBe(false);
    expect(steadingView(at(gold)).open).toBe(true);
    expect(steadingView(raised(at(0), { shrine: 1 })).open).toBe(true);
    expect(steadingView(raised(at(0), { shrine: 2 })).rows.find((r) => r.id === 'shrine')!.short).toBe('+2% XP');
  });
});

/** What a day of one action brings: items and XP. */
function day(start: State, action: { feature: string; id: string }) {
  let s = engine.command(
    start,
    T0,
    { type: 'start', lane: start.items['perch'] ? 'artisan' : 'gathering', action },
    seeded(1),
  ).state;
  for (let at = T0 + HOUR; at <= T0 + 24 * HOUR; at += HOUR)
    s = engine.advance({ ...s, lastSeen: at }, at, seeded(1)).state;
  return s;
}

describe('what the works give', () => {
  it('brings gathering more of what it makes (the Woodyard) and every skill more XP (the Shrine)', () => {
    const chopper = newState(4, T0);
    const plain = day(chopper, { feature: 'woodcutting', id: 'pine-tree' });
    const yard = day(raised(chopper, { woodyard: 5 }), { feature: 'woodcutting', id: 'pine-tree' });
    const shrine = day(raised(chopper, { shrine: 5 }), { feature: 'woodcutting', id: 'pine-tree' });
    expect(yard.items['pine-logs']).toBeGreaterThan(plain.items['pine-logs'] * 1.05);
    expect(shrine.skills.woodcutting.xp).toBeGreaterThan(plain.skills.woodcutting.xp * 1.03);
  });

  it('keeps ingredients in the artisan’s work (the Workshop)', () => {
    const cook = { ...newState(4, T0), items: { perch: 10_000, 'pine-logs': 10_000 } };
    const plain = day(cook, { feature: 'cooking', id: 'cooked-perch' });
    const shop = day(raised(cook, { workshop: 5 }), { feature: 'cooking', id: 'cooked-perch' });
    const used = (s: State) => 10_000 - (s.items.perch ?? 0);
    const made = (s: State) => s.items['cooked-perch'] ?? 0;
    expect(used(shop) / made(shop)).toBeLessThan(used(plain) / made(plain));
  });

  it('gives the fighter more damage (the Training yard) and food more healing (the Smokehouse)', () => {
    const foe = FOES[0];
    const f = fighterOf(fighterAt('march'), foe)!;
    const g = fighterOf(raised(fighterAt('march'), { 'training-yard': 5, smokehouse: 5 }), foe)!;
    expect(g.perks.damage - f.perks.damage).toBe(5);
    expect(g.hpPerks.foodHeal - f.hpPerks.foodHeal).toBe(15);
  });

  it('brings home more marks from an expedition (the Watchtower)', () => {
    const marks = (e: GameEvent | undefined) => (e?.type === 'expeditionDone' ? e.marks : 0);
    const plain = marks(runOnce('march', 2, 3).home);
    const watched = marks(runOnce('march', 2, 3, (s) => raised(s, { watchtower: 5 })).home);
    expect(plain).toBeGreaterThan(0);
    expect(watched).toBeGreaterThan(plain * 1.15);
  });
});
