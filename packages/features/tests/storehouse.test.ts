// The Storehouse: a lane that would bring a new kind of item into a full Storehouse stops and says
// so; the vendor buys at each item's price, never the last of what is worn, and sells food by
// Hitpoints level; gold enlarges the Storehouse by six slots, eight times.
import { formatStop, XP_TABLE } from '@idle-clash/content';
import { createEngine, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';
import { capacity, ENLARGE_COSTS } from '../src/shared/storehouse.ts';
import { storehouse } from '../src/storehouse/index.ts';

const T0 = Date.UTC(2026, 9, 21, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const rng = seeded(9);
const with24 = (extra: Record<string, number> = {}): State => ({
  ...newState(9, T0),
  // 24 different items: the Storehouse is full.
  items: { ...Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`junk-${i}`, 1])), ...extra },
});
const run = (route: 'sell' | 'buy' | 'enlarge', state: State, input: unknown) =>
  storehouse.routes[route].run(state, input, T0) as {
    state: State;
    result: { ok: boolean; reason?: { code: string } };
  };

describe('the Storehouse', () => {
  it('stops a lane that would bring a new item into a full Storehouse, and says why', () => {
    const r = engine.command(
      with24(),
      T0,
      { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } },
      rng,
    );
    expect(r.result).toEqual({ ok: false, reason: { code: 'storehouseFull' } });
    if (!r.result.ok) expect(formatStop(r.result.reason)).toBe('Storehouse full');
    // Gold takes no slot, and an item already held needs none.
    const holding = with24({ gold: 5 });
    holding.items['pine-logs'] = 3;
    delete holding.items['junk-0'];
    expect(
      engine.command(
        holding,
        T0,
        { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } },
        rng,
      ).result,
    ).toEqual({ ok: true });
  });

  it('sells at the item price, but never the last of what is worn or a kept find', () => {
    const s: State = {
      ...newState(9, T0),
      items: { 'oak-logs': 5, 'copper-sword': 1, 'silverbark-seed': 1 },
      features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
    };
    const sold = run('sell', s, { item: 'oak-logs', count: 4 });
    expect(sold.result).toEqual({ ok: true, gold: 56 });
    expect(sold.state.items).toMatchObject({ 'oak-logs': 1, gold: 56 });
    expect(run('sell', s, { item: 'oak-logs', count: 6 }).result).toMatchObject({ reason: { code: 'notEnough' } });
    expect(run('sell', s, { item: 'copper-sword', count: 1 }).result).toMatchObject({ reason: { code: 'wornItem' } });
    expect(run('sell', s, { item: 'silverbark-seed', count: 1 }).result).toMatchObject({
      reason: { code: 'notSellable' },
    });
  });

  it('sells food by Hitpoints level, for gold, into a free slot', () => {
    const s: State = { ...newState(9, T0), items: { gold: 1000 } };
    expect(run('buy', s, { item: 'bread', count: 10 }).state.items).toEqual({ gold: 800, bread: 10 });
    expect(run('buy', s, { item: 'meat-pie', count: 1 }).result).toMatchObject({ reason: { code: 'notSold' } });
    const hp10 = { ...s, skills: { hitpoints: { xp: XP_TABLE[10] } } };
    expect(run('buy', hp10, { item: 'meat-pie', count: 2 }).state.items).toEqual({ gold: 900, 'meat-pie': 2 });
    expect(run('buy', s, { item: 'bread', count: 51 }).result).toMatchObject({ reason: { code: 'notEnoughGold' } });
    expect(run('buy', with24({ gold: 1000 }), { item: 'bread', count: 1 }).result).toMatchObject({
      reason: { code: 'storehouseFull' },
    });
  });

  it('adds six slots for each enlargement, twenty-five in all, at the design prices', () => {
    let s: State = { ...newState(9, T0), items: { gold: 20_000_000 } };
    for (const cost of ENLARGE_COSTS) {
      const gold = s.items.gold;
      s = run('enlarge', s, {}).state;
      expect(gold - s.items.gold).toBe(cost);
    }
    expect(capacity(s)).toBe(24 + 6 * 25);
    expect(run('enlarge', s, {}).result).toMatchObject({ reason: { code: 'fullyEnlarged' } });
    expect(run('enlarge', newState(9, T0), {}).result).toMatchObject({ reason: { code: 'notEnoughGold' } });
  });
});
