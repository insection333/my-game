// Incursions (IA.md, Castle Clash): the fortress at your tier, scouted or not; once scouted, its garrison
// and trap, your attack's chance against it with Set against them; what taking it gives; the last assaults.
import { SINKS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, Panel, Pill } from '@idle-clash/ui';
import { fortressName, trapName } from './labels.ts';
import { AttackPlan } from './Plan.tsx';
import { navigate } from '../../router.ts';
import { ReportRow, reportSheet } from './Reports.tsx';
import { castleAct, castleRun, castleStore } from './store.ts';
import { hasAp, useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

/** Sends an assault, and on its answer opens the battle's account. */
async function assault() {
  const r = await castleRun({ type: 'incursion' });
  const report = castleStore.get().view?.logs[0];
  if (r?.ok && report) navigate(reportSheet(report.id));
}

export function Incursions() {
  const { castle, view, now, busy } = useSyncedCastle();
  if (!castle) return null;
  const tier = castle.incursionTier;
  const fortress = E.fortressAt(tier);
  const scouted = castle.incursionScoutedTier === tier;
  const marks = Math.round(
    (SINKS.INCURSION_MARKS_BASE + Math.floor(tier / 2)) * E.lift(E.modifiers(castle, now).marks),
  );
  const g = fortress.garrison;
  const past = (view?.logs ?? []).filter((l) => l.kind === 'incursion').slice(0, 5);
  return (
    <div className={s.grid}>
      <section data-section>
        <Panel
          title={fortressName(fortress.id)}
          aside={<Pill tone="woad">{t('castle.incursion.tier', { tier: fmt.int(tier) })}</Pill>}
          flush
        >
          <div data-slot="castle.incursion">
            <ActionRow
              name={
                scouted
                  ? t('castle.incursion.scouted', {
                      v: fmt.int(g[0]),
                      o: fmt.int(g[1]),
                      s: fmt.int(g[2]),
                      trap: trapName(fortress.trap),
                    })
                  : t('castle.incursion.unscouted')
              }
              facts={[]}
              actions={
                scouted ? undefined : (
                  <Button
                    disabled={busy || !hasAp(castle, SINKS.INCURSION_SCOUT_AP)}
                    onClick={() => void castleAct({ type: 'scoutIncursion' })}
                  >
                    {t('castle.incursion.scout', { ap: fmt.int(SINKS.INCURSION_SCOUT_AP) })}
                  </Button>
                )
              }
            />
            {scouted && (
              <div className={s.planBlock}>
                <AttackPlan def={E.fortressSide(tier)} />
              </div>
            )}
            <ActionRow
              name={t('castle.incursion.rewards', { marks: fmt.int(marks) })}
              facts={[]}
              actions={
                <Button
                  variant="primary"
                  disabled={busy || !hasAp(castle, SINKS.INCURSION_AP)}
                  onClick={() => void assault()}
                >
                  {t('castle.incursion.assault', { ap: fmt.int(SINKS.INCURSION_AP) })}
                </Button>
              }
            />
          </div>
        </Panel>
      </section>
      {past.length > 0 && (
        <section data-section>
          <Panel title={t('castle.reports.title')} flush>
            <ul className={s.reports}>
              {past.map((l) => (
                <ReportRow key={l.id} report={l} now={now} />
              ))}
            </ul>
          </Panel>
        </section>
      )}
    </div>
  );
}
