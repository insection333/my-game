// Incursions (IA.md, Castle Clash): the fortress at your tier, scouted or not, the likely outcome of your
// attack formation against it once scouted, what taking it gives, and the last assaults.
import { SINKS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, Panel, Pill } from '@idle-clash/ui';
import { fortressName, outcomeName, trapName } from './labels.ts';
import { ReportRow } from './Reports.tsx';
import { castleAct } from './store.ts';
import { hasAp, useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

export function Incursions() {
  const { castle, view, now, busy } = useSyncedCastle();
  if (!castle) return null;
  const tier = castle.incursionTier;
  const fortress = E.fortressAt(tier);
  const scouted = castle.incursionScoutedTier === tier;
  const odds = E.combatRatio(E.castleSide(castle, now, 'attack'), E.fortressSide(tier), 0.5).r;
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
              facts={
                scouted
                  ? [
                      t('castle.incursion.odds', {
                        outcome: outcomeName(E.outcomeOf(odds)),
                        r: fmt.num(Math.round(odds * 100) / 100),
                      }),
                    ]
                  : []
              }
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
            <ActionRow
              name={t('castle.incursion.rewards', { marks: fmt.int(marks) })}
              facts={[]}
              actions={
                <Button
                  variant="primary"
                  disabled={busy || !hasAp(castle, SINKS.INCURSION_AP)}
                  onClick={() => void castleAct({ type: 'incursion' })}
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
