// The pedlar on the Hearth (session 217): a row of Next up naming what the pedlar wants today, and its sheet:
// each lot with what is held, what it pays and Hand in, the favour earned, and when the lots change.
import { dayTurns, fmt, t } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { ERRAND_ORDER, type ErrandRow } from '../shared/errand.ts';
import { pedlarOf } from '../shared/pedlar.ts';
import { dayOf, handedToday, payFor } from './rules.ts';
import { lotsOf, type LotKind } from '../shared/pedlar-lots.ts';

export const PEDLAR_HREF = '/?panel=pedlar';

export interface LotRow {
  kind: LotKind;
  item: string;
  /** "Bird's nest ×3" */
  name: string;
  /** "You hold 5", or "You hold 1: 2 more needed". */
  held: string;
  /** "Pays 12,000 gold" */
  pays: string;
  done: boolean;
  ready: boolean;
}
export interface PedlarView {
  lots: LotRow[];
  /** "Favour: 14" */
  favour: string;
  /** "New wants at 11:00" */
  turns: string;
}

const lotName = (item: string, count: number) => t('pedlar.lot', { item: t(`item.${item}`), count: fmt.int(count) });

export function pedlarView(state: State, now: number): PedlarView {
  const handed = handedToday(state, now);
  return {
    lots: lotsOf(state, dayOf(now)).map((l) => {
      const held = countOf(state, l.item);
      const done = handed.includes(l.kind);
      return {
        kind: l.kind,
        item: l.item,
        name: lotName(l.item, l.count),
        held:
          held >= l.count
            ? t('pedlar.held', { count: fmt.int(held) })
            : t('pedlar.short', { count: fmt.int(held), more: fmt.int(l.count - held) }),
        pays: t('pedlar.pays', { gold: fmt.int(payFor(state, l)) }),
        done,
        ready: !done && held >= l.count,
      };
    }),
    favour: t('pedlar.favour', { count: fmt.int(pedlarOf(state).favour) }),
    turns: t('pedlar.turns', { when: dayTurns(now) }),
  };
}

/** The row of Next up: what is still wanted today, or nothing once all is handed in. */
export function pedlarErrands(state: State, now: number): ErrandRow[] {
  const handed = handedToday(state, now);
  const wanted = lotsOf(state, dayOf(now)).filter((l) => !handed.includes(l.kind));
  if (!wanted.length) return [];
  const names = wanted.map((l) => lotName(l.item, l.count));
  const list =
    names.length === 1 ? names[0] : t('list.and', { first: names.slice(0, -1).join(', '), last: names.at(-1)! });
  return [{ icon: wanted[0].item, text: t('pedlar.errand', { list }), href: PEDLAR_HREF, order: ERRAND_ORDER.pedlar }];
}

/** A lot handed in, said for its moment. */
export function pedlarPaidWords(e: { item: string; count: number; gold: number; favour: number }) {
  return {
    title: t('pedlar.paid', { item: t(`item.${e.item}`), count: fmt.int(e.count) }),
    body: t('pedlar.paidBody', { gold: fmt.int(e.gold), favour: fmt.int(e.favour) }),
  };
}
