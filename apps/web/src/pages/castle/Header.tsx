// Castle Clash's header, above every tab (SPEC.md section 5), kept to two short rows so each tab's own
// work starts high on a phone: AP with the Call to arms (and its streak) on one, the castle's rating, war
// marks, this week's decree and any shield on the other; the orders of the day (session 40); then why the
// last action was refused, or what opens the tab shown.
import { AP, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Button, Panel, Pill, ProgressBar, TextLink } from '@idle-clash/ui';
import { navigate } from '../../router.ts';
import { decreeName, refusal } from './labels.ts';
import { castleAct } from './store.ts';
import { useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

/** `note`: what opens the tab shown, while it is closed. */
export function Header({ note }: { note: string | null }) {
  const { castle, now, busy, refused } = useSyncedCastle();
  if (!castle) return null;
  const cap = E.apCap(castle, now);
  const answered = castle.lastCtaDateUtc === E.formatUtcDate(now);
  const streak = answered ? castle.streakAtLastCta : E.effectiveStreak(castle, now);
  const vigilance = E.vigilanceOf(castle, now);
  const ap = t('castle.ap', { ap: fmt.int(Math.floor(castle.activeAp)), cap: fmt.int(cap) });
  return (
    <section data-section>
      <Panel>
        <div data-slot="castle.header" className={s.header}>
          <div className={s.apRow}>
            <div className={s.ap}>
              <span className={s.apText}>{ap}</span>
              <ProgressBar value={castle.activeAp / cap} label={ap} />
            </div>
            <div className={s.call}>
              {answered ? (
                <Pill tone="moss">{t('castle.called')}</Pill>
              ) : (
                <Button variant="primary" disabled={busy} onClick={() => void castleAct({ type: 'callToArms' })}>
                  {t('castle.call', { ap: fmt.int(Math.floor(E.pendingReserve(castle, now))) })}
                </Button>
              )}
              <span className={s.muted}>
                {t('castle.streak', { streak: fmt.int(streak), max: fmt.int(AP.MAX_STREAK) })}
              </span>
            </div>
          </div>
          <div className={s.pills}>
            <Pill tone="woad">{t('castle.rating', { rating: fmt.int(castle.rating) })}</Pill>
            <Pill tone="gold">{t('castle.marks', { marks: fmt.int(castle.warMarks) })}</Pill>
            <Pill>{t('castle.decree', { decree: decreeName(E.decreeOf(now).id) })}</Pill>
            {E.isShielded(castle, now) && (
              <Pill tone="moss">{t('castle.shielded', { time: fmt.duration(castle.shieldUntil - now) })}</Pill>
            )}
            {vigilance > 0 && <Pill tone="moss">{t('castle.vigilance', { count: fmt.int(vigilance) })}</Pill>}
          </div>
          <Orders />
          {note && <p className={s.closed}>{note}</p>}
          {refused && (
            <p className={s.refused} role="status">
              {refusal(refused)}
            </p>
          )}
        </div>
      </Panel>
    </section>
  );
}

/** What an order asks, with its count where it has one. */
function orderText(o: E.Order): string {
  switch (o.kind) {
    case 'strongholds':
      return o.target === 1
        ? t('castle.order.strongholdsOne')
        : t('castle.order.strongholds', { count: fmt.int(o.target) });
    case 'drill':
      return o.target === 1 ? t('castle.order.drillOne') : t('castle.order.drill', { count: fmt.int(o.target) });
    case 'incursion':
      return t('castle.order.incursion');
    case 'dig':
      return t('castle.order.dig');
    case 'spy':
      return t('castle.order.spy');
    case 'lord':
      return t('castle.order.lord');
  }
}

/** Where each order is done. */
const ORDER_TAB: Record<E.OrderKind, string> = {
  strongholds: '/castle',
  incursion: '/castle',
  spy: '/castle',
  lord: '/castle',
  drill: '/castle/army',
  dig: '/castle/citadel',
};

/** The orders of the day (session 40): how many are done, and each order with how far along it is, a link
 *  to where it is done, ticked once done. */
function Orders() {
  const { castle, now } = useSyncedCastle();
  if (!castle) return null;
  const orders = E.ordersOf(castle, now);
  const done = orders.list.filter((o) => o.progress >= o.target).length;
  return (
    <div className={s.orders} data-slot="castle.orders">
      <span className={s.ordersHead}>
        {orders.paid
          ? t('castle.orders.paid')
          : t('castle.orders.title', { done: fmt.int(done), total: fmt.int(orders.list.length) })}
      </span>
      <ul className={s.orderList}>
        {orders.list.map((o) => {
          const finished = o.progress >= o.target;
          return (
            <li key={o.kind} data-done={finished || undefined}>
              <span aria-hidden="true">{finished ? '✓' : '○'}</span>
              {finished ? (
                <span>{orderText(o)}</span>
              ) : (
                <TextLink href={ORDER_TAB[o.kind]} onNavigate={navigate}>
                  {orderText(o)}
                </TextLink>
              )}
              {!finished && o.target > 1 && (
                <span className={s.muted}>
                  {t('castle.order.progress', { done: fmt.int(o.progress), target: fmt.int(o.target) })}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
