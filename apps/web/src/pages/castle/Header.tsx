// Castle Clash's header, above every tab (SPEC.md section 5), kept to two short rows so each tab's own
// work starts high on a phone: AP with the Call to arms (and its streak) on one, the castle's rating, war
// marks, this week's decree and any shield on the other; then why the last action was refused, or what
// opens the tab shown.
import { AP, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Button, Panel, Pill, ProgressBar } from '@idle-clash/ui';
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
