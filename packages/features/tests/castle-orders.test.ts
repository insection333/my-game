// The orders of the day (session 40): three a day, the day's strongholds always first, spies from the first
// day (session 167) and lords only once lords are open; each order pays as it is done and the three
// together pay more, once; a new day brings new orders.
import { ORDERS } from '@idle-clash/content';
import { describe, expect, it } from 'vitest';
import { bastionRating, newCastle, ordersOf, recordOrder, type Castle } from '../src/shared/castle/index.ts';

const T0 = Date.UTC(2026, 10, 3, 9);
const DAY = 86_400_000;

/** A castle `days` old (30 by default: lords open at two weeks, or at an average level of 3). */
function castle(level: number, id = 'lord', days = 30): Castle {
  const c = newCastle(id, T0 - days * DAY);
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as Castle['levels'];
  const out = { ...c, levels };
  return { ...out, rating: bastionRating(out) };
}

describe('the orders of the day', () => {
  // Spies from the first day, on the day's foes (session 167); lords only once lords are open.
  it('are three, the strongholds first, lords only once lords are open', () => {
    for (let i = 0; i < 40; i++) {
      const young = ordersOf(castle(1, `young-${i}`, 1), T0);
      expect(young.list).toHaveLength(3);
      expect(young.list[0].kind).toBe('strongholds');
      // A young castle is asked for one stronghold; an older one for two or three.
      expect(young.list[0].target).toBe(ORDERS.YOUNG_STRONGHOLDS);
      expect(ORDERS.STRONGHOLDS).toContain(ordersOf(castle(10, `young-${i}`), T0).list[0].target);
      expect(new Set(young.list.map((o) => o.kind)).size).toBe(3);
      expect(young.list.some((o) => o.kind === 'lord')).toBe(false);
    }
    const youngKinds = new Set(
      Array.from({ length: 60 }, (_, i) => ordersOf(castle(1, `y-${i}`, 1), T0).list.map((o) => o.kind)).flat(),
    );
    expect(youngKinds.has('spy')).toBe(true);
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

describe('an incursion asked for', () => {
  it('is not drawn while no roll takes the fortress at the castle tier (session 139)', () => {
    for (let i = 0; i < 60; i++) {
      const far = { ...castle(2, `far-${i}`), incursionTier: 14 };
      expect(ordersOf(far, T0).list.some((o) => o.kind === 'incursion')).toBe(false);
    }
    const near = Array.from({ length: 60 }, (_, i) => ordersOf(castle(10, `near-${i}`), T0).list).flat();
    expect(near.some((o) => o.kind === 'incursion')).toBe(true);
  });

  // Session 169: a castle open to lords with none in reach (a small realm) was ordered to besiege one.
  it('never asks for a lord when none stands in reach', () => {
    for (let i = 0; i < 60; i++)
      expect(ordersOf(castle(10, `alone-${i}`), T0, false).list.some((o) => o.kind === 'lord')).toBe(false);
  });
});
