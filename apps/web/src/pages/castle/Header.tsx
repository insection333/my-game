// Castle Clash's header, above every tab (SPEC.md section 5), in the keep's card beside or under the
// castle's banner (session 133), kept to two short rows so each tab's own work starts high on a phone: AP with the Call to arms (and its streak) on one, the castle's rating, war
// marks, this week's decree and any shield on the other; the orders of the day (session 40); then why the
// last action was refused, or what opens the tab shown.
import { AP, dayTurns, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Button, Pill, ProgressBar, TextLink } from '@idle-clash/ui';
import { navigate } from '../../router.ts';
import { decreeName, evolutionName, relicName, unitName } from './labels.ts';
import { pct } from './targets.ts';
import { castleAct } from './store.ts';
import { useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

/** `note`: what opens the tab shown, while it is closed. `overview`: the War, where the day's orders and
 *  the castle's next step are shown (session 141: on every tab they stood the keep 440 px tall on a phone,
 *  and each tab's own work began below the first screen); the orders link to where each is done. */
export function Header({ note, overview }: { note: string | null; overview: boolean }) {
  const { castle, now, busy, refused, refusedAt } = useSyncedCastle();
  if (!castle) return null;
  const cap = E.apCap(castle, now);
  const answered = castle.lastCtaDateUtc === E.formatUtcDate(now);
  const streak = answered ? castle.streakAtLastCta : E.effectiveStreak(castle, now);
  const vigilance = E.vigilanceOf(castle, now);
  const ap = t('castle.ap', { ap: fmt.int(Math.floor(castle.activeAp)), cap: fmt.int(cap) });
  // How AP comes back on a day answered (session 127: a lord short of AP had no word of when).
  const flow = E.apFlow(castle, now);
  const rate = flow && fmt.int(Math.round(flow.perHour));
  const flowLine = !flow
    ? null
    : flow.full
      ? t('castle.apFull')
      : flow.fullAt !== null
        ? t('castle.apFlow', { rate: rate!, time: fmt.when(flow.fullAt, now) })
        : t('castle.apFlowDay', { rate: rate!, back: dayTurns(now) });
  return (
    <div data-slot="castle.header" className={s.header}>
      <div className={s.apRow}>
        <div className={s.ap}>
          <span className={s.apText}>{ap}</span>
          <ProgressBar value={castle.activeAp / cap} label={ap} />
          {flowLine && <span className={s.muted}>{flowLine}</span>}
        </div>
        <div className={s.call}>
          {answered ? (
            <Pill tone="moss">{t('castle.called')}</Pill>
          ) : (
            <Button variant="primary" disabled={busy} onClick={() => void castleAct({ type: 'callToArms' })}>
              {t('castle.call', { ap: fmt.int(Math.floor(E.callGain(castle, now))) })}
            </Button>
          )}
          <span className={s.muted}>
            {t('castle.streak', { streak: fmt.int(streak), max: fmt.int(AP.MAX_STREAK) })}
          </span>
        </div>
      </div>
      <div className={s.pills}>
        <Pill tone="woad">{t('castle.rating', { rating: fmt.int(castle.rating) })}</Pill>
        <Pill tone="gold">
          {castle.warMarks === 1 ? t('castle.marksOne') : t('castle.marks', { marks: fmt.int(castle.warMarks) })}
        </Pill>
        <Pill>{t('castle.decree', { decree: decreeName(E.decreeOf(now).id) })}</Pill>
        {E.isShielded(castle, now) && (
          <Pill tone="moss">{t('castle.shielded', { time: fmt.duration(castle.shieldUntil - now) })}</Pill>
        )}
        {vigilance > 0 && <Pill tone="moss">{t('castle.vigilance', { count: fmt.int(vigilance) })}</Pill>}
      </div>
      {overview && <Orders />}
      {overview && <Next />}
      {note && <p className={s.closed}>{note}</p>}
      {/* A battle's refusal is said on its own row in the War (session 119). */}
      {refused && refusedAt === null && (
        <p className={s.refused} role="status">
          {refused}
        </p>
      )}
    </div>
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

/** The castle's next milestone and how far off it is (session 140): a troop's next evolution, a relic's
 *  next level, or the next temper. Its name links to the tab where it is reached, and what it takes follows
 *  ("Sunforged Phalanx at vanguard level 14: 3 more levels, 5.2M gold"), so the link keeps one line as the
 *  orders' links do. */
function Next() {
  const { castle, now } = useSyncedCastle();
  const next = castle && E.nextForCastle(castle, now);
  if (!next) return null;
  const name = next.kind === 'evolution' ? evolutionName(next.evolution) : relicName(next.relic);
  const rest =
    next.kind === 'evolution'
      ? t(next.levels === 1 ? 'castle.next.evolutionOne' : 'castle.next.evolution', {
          unit: unitName(next.unit).toLowerCase(),
          level: fmt.int(next.level),
          levels: fmt.int(next.levels),
          gold: fmt.short(next.gold),
        })
      : next.kind === 'relic'
        ? t('castle.next.relic', { level: fmt.int(next.level), gold: fmt.short(next.gold), marks: fmt.int(next.marks) })
        : t('castle.next.temper', {
            temper: fmt.int(next.temper),
            pct: pct(next.chance),
            gold: fmt.short(next.gold),
            marks: fmt.int(next.marks),
          });
  return (
    <div className={s.next} data-slot="castle.next">
      <span className={s.ordersHead}>{t('castle.next.title')}</span>
      <p>
        <TextLink href={next.kind === 'evolution' ? '/castle/army' : '/castle/halls'} onNavigate={navigate}>
          {name}
        </TextLink>{' '}
        {rest}
      </p>
    </div>
  );
}
