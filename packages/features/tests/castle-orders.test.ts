// The orders of the day (session 40): three a day, the day's strongholds always first, spies and lords
// only once lords are open; each order pays as it is done and the three together pay more, once; a new
// day brings new orders.
import { ORDERS } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { bastionRating, newCastle, ordersOf, recordOrder, type Castle } from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 3, 9);
const DAY = 86_400_000;

function castle(level: number, id = 'lord'): Castle {
  const c = newCastle(id, T0 - 30 * DAY);
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as Castle['levels'];
  const out = { ...c, levels };
  return { ...out, rating: bastionRating(out) };
}

describe('the orders of the day', () => {
  it('are three, the strongholds first, spies and lords only once lords are open', () => {
    for (let i = 0; i < 40; i++) {
      const young = ordersOf(castle(1, `young-${i}`), T0);
      expect(young.list).toHaveLength(3);
      expect(young.list[0].kind).toBe('strongholds');
      // A young castle is asked for one stronghold; an older one for two or three.
      expect(young.list[0].target).toBe(ORDERS.YOUNG_STRONGHOLDS);
      expect(ORDERS.STRONGHOLDS).toContain(ordersOf(castle(10, `young-${i}`), T0).list[0].target);
      expect(new Set(young.list.map((o) => o.kind)).size).toBe(3);
      expect(young.list.some((o) => o.kind === 'spy' || o.kind === 'lord')).toBe(false);
    }
    const kinds = new Set(
      Array.from({ length: 60 }, (_, i) => ordersOf(castle(10, `old-${i}`), T0).list.map((o) => o.kind)).flat(),
    );
    expect(kinds).toEqual(new Set(['strongholds', 'incursion', 'drill', 'dig', 'spy', 'lord']));
  });

  it('pay each as it is done, and the three together once', () => {
    let c = castle(10);
    const today = ordersOf(c, T0);
    c = { ...c, orders: today };
    let total = 0;
    for (const o of today.list) {
      // Short of its count, nothing is paid; the last one done pays.
      const part = recordOrder(c, o.kind, o.target - 1, T0);
      expect(part.done).toEqual([]);
      c = part.castle;
      total += part.marks;
      const rest = recordOrder(c, o.kind, 5, T0);
      expect(rest.done).toEqual([o.kind]);
      c = rest.castle;
      total += rest.marks;
    }
    expect(total).toBe(3 * ORDERS.MARKS + ORDERS.ALL_MARKS);
    expect(c.warMarks).toBe(total);
    expect(c.orders!.paid).toBe(true);
    // Done is done: nothing more today.
    expect(recordOrder(c, today.list[0].kind, 1, T0).marks).toBe(0);
    // An order not given today counts for nothing.
    const other = (['incursion', 'drill', 'dig', 'spy', 'lord'] as const).find(
      (k) => !today.list.some((o) => o.kind === k),
    )!;
    expect(recordOrder({ ...castle(10), orders: today }, other, 9, T0).marks).toBe(0);
    // Tomorrow: three new orders, nothing done.
    expect(ordersOf(c, T0 + DAY).list.every((o) => o.progress === 0)).toBe(true);
    expect(ordersOf(c, T0 + DAY).paid).toBe(false);
  });
});
