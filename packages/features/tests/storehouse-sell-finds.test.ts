// Selling the finds kept to sell (session 187): twenty Uncommon finds are used nowhere and come by the
// dozen (a newcomer held ninety bird's nests after a night), each taking a space until sold one panel at
// a time, so a lane stopped "Storehouse full" for want of selling them. One press sells every one held,
// all of each, at the vendor's price, and nothing else.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { FEATURES, findOf, items } from '../src/index.ts';
import { storehouse } from '../src/storehouse/index.ts';

const T0 = Date.UTC(2026, 10, 23, 9);
const sellFinds = (state: State) =>
  storehouse.routes.sellFinds.run(state, {}, T0) as {
    state: State;
    result: { ok: true; gold: number; kinds: number } | { ok: false; reason: { code: string } };
  };

describe('selling the finds kept to sell', () => {
  it('sells every Uncommon find held, all of each, and nothing else', () => {
    const s: State = {
      ...newState(9, T0),
      items: { gold: 5, 'birds-nest': 90, 'amber-nugget': 2, 'carved-acorn': 3, 'pine-logs': 40 },
    };
    const r = sellFinds(s);
    expect(r.result).toEqual({ ok: true, gold: 90 * 100 + 2 * 1200, kinds: 2 });
    expect(r.state.items).toMatchObject({ gold: 5 + 9000 + 2400, 'carved-acorn': 3, 'pine-logs': 40 });
    expect(r.state.items['birds-nest'] ?? 0).toBe(0);
    expect(r.state.items['amber-nugget'] ?? 0).toBe(0);
  });

  it('says so when there is none to sell', () => {
    const r = sellFinds({ ...newState(9, T0), items: { 'carved-acorn': 3 } });
    expect(r.result).toEqual({ ok: false, reason: { code: 'nothingToSell' } });
  });

  it('sells only what is used nowhere: every Uncommon find is', () => {
    const uncommon = items.catalog(FEATURES).filter((i) => findOf(i.id)?.rarity === 'uncommon');
    expect(uncommon.length).toBe(20);
    for (const i of uncommon) expect(items.usedIn(FEATURES, i.id)).toEqual([]);
  });

  it('is offered beside the space with what it brings', () => {
    const view = storehouse.slots['store.capacity']({
      state: { ...newState(9, T0), items: { 'birds-nest': 90, 'amber-nugget': 2 } },
      now: T0,
    }) as { sellFinds: { label: string; ask: string } | null };
    expect(view.sellFinds?.label).toBe('Sell finds for 11,400 gold');
    expect(view.sellFinds?.ask).toBe(
      "Sell every bird's nest and amber nugget for 11,400 gold? They are used nowhere, and your collection log keeps them.",
    );
    const four = storehouse.slots['store.capacity']({
      state: { ...newState(9, T0), items: { 'birds-nest': 1, 'amber-nugget': 1, 'rough-garnet': 1, 'chalk-stub': 1 } },
      now: T0,
    }) as { sellFinds: { ask: string } };
    expect(four.sellFinds.ask).toMatch(/^Sell every bird's nest, amber nugget and 2 more for 1,500 gold\?/);
  });
});
