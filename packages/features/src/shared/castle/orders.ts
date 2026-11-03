// The orders of the day (session 40): three small aims each UTC day, so a visit to the castle has a shape
// and an end. The first is always the day's strongholds; the other two are drawn from your id and the day,
// among what your castle can do (spies and lords only once lords are open). Each order done pays war
// marks at once, and the three together pay more: nothing to claim. Pure.
import { ORDERS } from '@idle-clash/content';
import { formatUtcDate, type Castle } from './castle.ts';
import { hash } from './mercenaries.ts';
import { lordsOpen } from './unlocks.ts';

export type OrderKind = 'strongholds' | 'incursion' | 'drill' | 'dig' | 'spy' | 'lord';
export interface Order {
  kind: OrderKind;
  target: number;
  progress: number;
}
export interface Orders {
  /** The UTC day they are for. */
  day: string;
  list: Order[];
  /** Whether the three together have paid. */
  paid: boolean;
}

const OTHERS: readonly OrderKind[] = ['incursion', 'drill', 'dig', 'spy', 'lord'];

/** How much an order asks: a young castle (lords not yet open) is asked for less, its AP covering little. */
function targetOf(kind: OrderKind, h: number, young: boolean): number {
  if (kind === 'strongholds')
    return young ? ORDERS.YOUNG_STRONGHOLDS : ORDERS.STRONGHOLDS[h % ORDERS.STRONGHOLDS.length];
  if (kind === 'drill') return young ? ORDERS.YOUNG_DRILLS : ORDERS.DRILLS;
  return 1;
}

/** Today's orders: those already kept on the castle, or a fresh three. */
export function ordersOf(c: Castle, now: number): Orders {
  const day = formatUtcDate(now);
  if (c.orders && c.orders.day === day) return c.orders;
  const open = OTHERS.filter((k) => lordsOpen(c) || (k !== 'spy' && k !== 'lord'));
  const drawn = open
    .map((kind) => ({ kind, k: hash(`${c.userId}:${day}:${kind}`) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 2)
    .map((x) => x.kind);
  const h = hash(`${c.userId}:${day}`);
  return {
    day,
    list: (['strongholds', ...drawn] as OrderKind[]).map((kind) => ({
      kind,
      target: targetOf(kind, h, !lordsOpen(c)),
      progress: 0,
    })),
    paid: false,
  };
}

export interface OrdersDone {
  castle: Castle;
  /** The orders this finished, and the war marks they paid (the three together's among them). */
  done: OrderKind[];
  all: boolean;
  marks: number;
}

/** Counts `n` towards today's order of this kind; what it finishes pays at once. */
export function recordOrder(c: Castle, kind: OrderKind, n: number, now: number): OrdersDone {
  const orders = ordersOf(c, now);
  const done: OrderKind[] = [];
  const list = orders.list.map((o) => {
    if (o.kind !== kind || o.progress >= o.target) return o;
    const progress = Math.min(o.target, o.progress + n);
    if (progress >= o.target) done.push(kind);
    return { ...o, progress };
  });
  const all = !orders.paid && list.every((o) => o.progress >= o.target);
  const marks = done.length * ORDERS.MARKS + (all ? ORDERS.ALL_MARKS : 0);
  return {
    castle: {
      ...c,
      orders: { ...orders, list, paid: orders.paid || all },
      warMarks: c.warMarks + marks,
      warMarksEarned: c.warMarksEarned + marks,
    },
    done,
    all,
    marks,
  };
}
