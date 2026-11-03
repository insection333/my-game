// A target's sheet in the War room (`?panel=target&target=<id>`, IA.md): what is known of it, the attack
// planned against it, what a win brings, the siege with its fee (sent in the formation set against them,
// the sheet closing so its result lands on their row), a lord's four spy missions, and the last reports
// about it.
import { SPY_MISSIONS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, ItemIcon, Pill, Sheet } from '@idle-clash/ui';
import { ReportPlayer } from '../ReportPlayer.tsx';
import { missionDoes, missionName, refusal, trapName } from './labels.ts';
import { AttackPlan } from './Plan.tsx';
import { cardOf } from './report-model.ts';
import { ReportCardLink } from './ReportCards.tsx';
import { garrisonLine, when } from './Reports.tsx';
import { castleRun, fight } from './store.ts';
import { affords, hasAp, useSyncedCastle } from './synced.ts';
import { defenceOf, paysLine, pct, scoutingOf, type Target } from './targets.ts';
import s from './castle.module.css';
import r from './reports.module.css';

export function TargetSheet({ target, onClose }: { target: Target; onClose: () => void }) {
  const { castle, view, now, purse, busy, refused } = useSyncedCastle();
  if (!castle) return null;
  const logs = view?.logs ?? [];
  const about = logs.filter((l) => (target.merc ? sameMerc(l.data.merc, target.merc) : l.data.foe === target.id));
  const scouted = target.merc ? null : scoutingOf(logs, target.id);
  const costs = target.merc
    ? E.mercenaryCosts(castle, target.merc, now)
    : E.siegeCosts(castle, E.brRatio(castle, { rating: target.rating }), now);
  const shielded = target.shieldedUntil !== null && target.shieldedUntil > now;
  const blocked = E.siegeRefusal(castle, target.id, shielded, costs.ap, now);
  const def = defenceOf(castle, target, logs, now);
  return (
    <Sheet title={target.name} closeLabel={t('shell.close')} onClose={onClose} slot="castle.target">
      <div className={s.sheet}>
        {/* Their arms beside how they stand. */}
        <div className={s.arms}>
          <ItemIcon name="crest" crest={target.id} size={48} />
          <div className={s.pills}>
            <Pill tone="woad">{t('castle.target.rating', { rating: fmt.int(target.rating) })}</Pill>
            {target.merc && <Pill>{t('castle.target.mercenary')}</Pill>}
            {target.struck !== null && (
              <Pill tone="ember">{t('castle.target.struckAt', { when: when(target.struck, now) })}</Pill>
            )}
          </div>
        </div>
        {/* The header is behind the sheet: a refusal is said here too. */}
        {refused && (
          <p className={s.refused} role="status">
            {refusal(refused)}
          </p>
        )}
        <div className={s.sheetSection}>
          <h3>{t('castle.siege.title')}</h3>
          {target.merc && (
            <p>
              {t('castle.incursion.scouted', {
                v: fmt.int(target.merc.garrison[0]),
                o: fmt.int(target.merc.garrison[1]),
                s: fmt.int(target.merc.garrison[2]),
                trap: trapName(target.merc.trap),
              })}
            </p>
          )}
          {scouted && (
            <p>
              {t('castle.siege.scouted', { when: when(scouted.at, now) })}: {garrisonLine(scouted.report)}
            </p>
          )}
          {def ? (
            <AttackPlan def={def} estimate={!target.merc} />
          ) : (
            <p className={s.muted}>{t('castle.siege.unscouted')}</p>
          )}
          {/* A lord too strong as they stand: the spies below are how to make the odds, and the chance counts them. */}
          {def && !target.merc && E.winChance(E.bestOffense(castle, def, now).r) < 0.5 && (
            <p className={s.muted}>{t('castle.siege.weaken')}</p>
          )}
          <p>{paysLine(castle, target, view?.warChest ?? 0, logs, now)}</p>
          <div className={s.save}>
            <Button
              variant="primary"
              disabled={busy || blocked !== null || !hasAp(castle, costs.ap) || !affords(castle, purse, costs.gold)}
              onClick={() => {
                // The sheet closes, and the battle's result lands on the target's row.
                const best = def ? E.bestOffense(castle, def, now) : null;
                onClose();
                void fight(target.id, {
                  type: 'siege',
                  target: target.id,
                  ...(best ? { shares: [...best.shares] as [number, number, number] } : {}),
                });
              }}
            >
              {t('castle.siege', { gold: fmt.short(costs.gold), ap: fmt.int(costs.ap) })}
            </Button>
            {blocked && blocked !== 'ap' && <span className={s.muted}>{refusal(blocked)}</span>}
          </div>
        </div>
        {!target.merc && <Missions target={target} />}
        {about.length > 0 && (
          <div className={s.sheetSection}>
            <h3>{t('castle.reports.title')}</h3>
            <ul className={r.cards}>
              {about
                .slice(0, 3)
                .map((l) => cardOf(l, castle.userId))
                .filter((c) => c !== null)
                .map((c) => (
                  <ReportCardLink key={c.id} card={c} now={now} />
                ))}
            </ul>
          </div>
        )}
        {!target.merc && <ReportPlayer name={target.name} />}
      </div>
    </Sheet>
  );
}

/** Whether a mercenary report is about this stronghold (by its name, which is what the lord saw). */
function sameMerc(logged: unknown, m: E.Mercenary): boolean {
  if (!logged || typeof logged !== 'object') return false;
  const named = logged as { first?: unknown; second?: unknown };
  return named.first === m.first && named.second === m.second;
}

function Missions({ target }: { target: Target }) {
  const { castle, now, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  // Bribes scale with the stronger castle; only the target's rating is needed for that.
  const them = { ...castle, userId: target.id, rating: target.rating };
  return (
    <div className={s.sheetSection}>
      <h3>{t('castle.spy.title')}</h3>
      <div className={s.missions} data-slot="castle.missions">
        {SPY_MISSIONS.map((m) => {
          const cost = E.spyCosts(castle, them, m, now);
          return (
            <ActionRow
              key={m.id}
              name={missionName(m.id)}
              facts={[
                missionDoes(m.id),
                ...(target.spyChance === null ? [] : [t('castle.mission.chance', { pct: pct(target.spyChance) })]),
              ]}
              actions={
                <Button
                  disabled={busy || !hasAp(castle, cost.ap) || !affords(castle, purse, cost.gold)}
                  onClick={() => void castleRun({ type: 'spy', target: target.id, mission: m.id })}
                >
                  {t('castle.mission.send', { gold: fmt.short(cost.gold), ap: fmt.int(cost.ap) })}
                </Button>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
