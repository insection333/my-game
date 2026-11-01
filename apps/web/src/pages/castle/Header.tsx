// Castle Clash's header, above every tab (SPEC.md section 5): AP ready and in reserve with the Call to
// arms and its streak; this week's decree; the treasury, what the vault keeps safe and what is raidable;
// the castle's rating and war marks; a shield or vigilance; and why the last action was refused.
import { AP, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Button, Panel, Pill, ProgressBar } from '@idle-clash/ui';
import { useSyncedCastle } from './synced.ts';
import { decreeName, refusal } from './labels.ts';
import { castleAct } from './store.ts';
import s from './castle.module.css';

/** `note`: what opens the tab shown, while it is closed. */
export function Header({ note }: { note: string | null }) {
  const { castle, now, busy, refused } = useSyncedCastle();
  if (!castle) return null;
  const cap = E.apCap(castle, now);
  const answered = castle.lastCtaDateUtc === E.formatUtcDate(now);
  const streak = answered ? castle.streakAtLastCta : E.effectiveStreak(castle, now);
  const reserve = E.pendingReserve(castle, now);
  const safe = E.protectedGold(castle, now);
  const vigilance = E.vigilanceOf(castle, now);
  const ap = fmt.int(Math.floor(castle.activeAp));
  return (
    <section data-section>
      <Panel>
        <div data-slot="castle.header" className={s.header}>
          <div className={s.apRow}>
            <div className={s.ap}>
              <span className={s.apText}>{t('castle.ap', { ap, cap: fmt.int(cap) })}</span>
              <ProgressBar value={castle.activeAp / cap} label={t('castle.ap', { ap, cap: fmt.int(cap) })} />
              {!answered && (
                <span className={s.muted}>{t('castle.reserve', { ap: fmt.int(Math.floor(reserve)) })}</span>
              )}
            </div>
            <div className={s.call}>
              <Button
                variant={answered ? 'secondary' : 'primary'}
                disabled={answered || busy}
                onClick={() => void castleAct({ type: 'callToArms' })}
              >
                {answered ? t('castle.called') : t('castle.call')}
              </Button>
              <span className={s.muted}>
                {t('castle.streak', { streak: fmt.int(streak), max: fmt.int(AP.MAX_STREAK) })}
              </span>
            </div>
          </div>
          <div className={s.pills}>
            <Pill tone="woad">{t('castle.rating', { rating: fmt.int(castle.rating) })}</Pill>
            <Pill tone="gold">{t('castle.marks', { marks: fmt.int(castle.warMarks) })}</Pill>
            <Pill>{t('castle.decree', { decree: decreeName(E.decreeOf(now).id) })}</Pill>
            <Pill>
              {t('castle.treasuryHeld', {
                gold: fmt.short(castle.treasury),
                raidable: fmt.short(Math.max(0, castle.treasury - safe)),
              })}
            </Pill>
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
