// The War room (IA.md, Castle Clash): today's targets (lords near your rating, then mercenary strongholds)
// and your reports. A target opens its sheet (`?panel=target&target=<id>`): what is known of it, the siege
// with its fee, and for a lord the four spy missions with their chances.
import { SPY_MISSIONS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, Panel, Pill, Sheet } from '@idle-clash/ui';
import { useEffect } from 'react';
import { navigate, useLocation, withPanel } from '../../router.ts';
import { mercName, missionDoes, missionName, outcomeName, refusal } from './labels.ts';
import { garrisonLine, ReportRow, Reports, when } from './Reports.tsx';
import { castleAct, loadTargets } from './store.ts';
import { affords, hasAp, useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

interface Target {
  id: string;
  name: string;
  rating: number;
  spyChance: number | null;
  merc: E.Mercenary | null;
}

const sheetOf = (id: string) => `${location.pathname}?panel=target&target=${encodeURIComponent(id)}`;

function useTargets(): Target[] {
  const { targets } = useSyncedCastle();
  useEffect(() => {
    void loadTargets(targets === null);
    // Loaded once each time the War room opens; an action that changes them reloads them (store.ts).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!targets) return [];
  return [
    ...targets.lords.map((l) => ({ ...l, merc: null })),
    ...targets.mercenaries.map((m) => ({
      id: m.id,
      name: mercName(m.first, m.second),
      rating: m.rating,
      spyChance: null,
      merc: m,
    })),
  ];
}

export function WarRoom() {
  const { view, now } = useSyncedCastle();
  const { panel } = useLocation();
  const targets = useTargets();
  const open =
    panel === 'target' ? targets.find((x) => x.id === new URLSearchParams(location.search).get('target')) : undefined;
  return (
    <div className={s.grid}>
      <section data-section>
        <Panel title={t('castle.targets.title')} flush>
          <div data-slot="castle.targets">
            {targets.length === 0 && <p className={s.lead}>{t('castle.targets.none')}</p>}
            {targets.map((x) => (
              <ActionRow
                key={x.id}
                name={x.name}
                status={
                  <Pill tone={x.merc ? undefined : 'woad'}>
                    {t('castle.target.rating', { rating: fmt.int(x.rating) })}
                  </Pill>
                }
                facts={x.merc ? [t('castle.target.mercenary')] : []}
                actions={<Button onClick={() => navigate(sheetOf(x.id))}>{t('castle.target.open')}</Button>}
              />
            ))}
          </div>
        </Panel>
      </section>
      <Reports logs={view?.logs ?? []} now={now} />
      {open && <TargetSheet target={open} onClose={() => navigate(withPanel(null).replace(/[?&]target=[^&]*/, ''))} />}
    </div>
  );
}

/** Whether a mercenary report is about this stronghold (by its name, which is what the lord saw). */
function sameMerc(logged: unknown, m: E.Mercenary): boolean {
  if (!logged || typeof logged !== 'object') return false;
  const named = logged as { first?: unknown; second?: unknown };
  return named.first === m.first && named.second === m.second;
}

function TargetSheet({ target, onClose }: { target: Target; onClose: () => void }) {
  const { castle, view, now, purse, busy, refused } = useSyncedCastle();
  if (!castle) return null;
  const about = (view?.logs ?? []).filter((l) =>
    target.merc ? sameMerc(l.data.merc, target.merc) : l.data.foe === target.id,
  );
  const scouted = about.find((l) => l.kind === 'spyOut' && l.data.report && typeof l.data.report === 'object');
  const costs = target.merc
    ? E.mercenaryCosts(castle, target.merc, now)
    : E.siegeCosts(castle, E.brRatio(castle, { rating: target.rating }), now);
  const blocked = E.siegeRefusal(castle, target.id, false, costs.ap, now);
  const odds = target.merc
    ? E.combatRatio(E.castleSide(castle, now, 'attack'), E.mercenarySide(target.merc), 0.5).r
    : null;
  return (
    <Sheet title={target.name} closeLabel={t('shell.close')} onClose={onClose} slot="castle.target">
      <div className={s.sheet}>
        <div className={s.pills}>
          <Pill tone="woad">{t('castle.target.rating', { rating: fmt.int(target.rating) })}</Pill>
          {target.merc && <Pill>{t('castle.target.mercenary')}</Pill>}
        </div>
        {/* The header is behind the sheet: a refusal is said here too. */}
        {refused && (
          <p className={s.refused} role="status">
            {refusal(refused)}
          </p>
        )}
        <div className={s.sheetSection}>
          <h3>{t('castle.siege.title')}</h3>
          {odds !== null ? (
            <p>
              {t('castle.siege.odds', {
                outcome: outcomeName(E.outcomeOf(odds)),
                r: fmt.num(Math.round(odds * 100) / 100),
              })}
            </p>
          ) : scouted ? (
            <p>
              {t('castle.siege.scouted', { when: when(scouted.at, now) })}:{' '}
              {garrisonLine(scouted.data.report as Record<string, unknown>)}
            </p>
          ) : (
            <p className={s.muted}>{t('castle.siege.unscouted')}</p>
          )}
          <div className={s.save}>
            <Button
              variant="primary"
              disabled={busy || blocked !== null || !hasAp(castle, costs.ap) || !affords(castle, purse, costs.gold)}
              onClick={() => void castleAct({ type: 'siege', target: target.id })}
            >
              {t('castle.siege', { gold: fmt.short(costs.gold), ap: fmt.int(costs.ap) })}
            </Button>
            {blocked === 'pairLimit' && <span className={s.muted}>{t('castle.refused.pairLimit')}</span>}
          </div>
        </div>
        {!target.merc && <Missions target={target} />}
        {about.length > 0 && (
          <div className={s.sheetSection}>
            <h3>{t('castle.reports.title')}</h3>
            <ul className={s.reports}>
              {about.slice(0, 3).map((l) => (
                <ReportRow key={l.id} report={l} now={now} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </Sheet>
  );
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
                ...(target.spyChance === null
                  ? []
                  : [t('castle.mission.chance', { pct: fmt.pct(Math.round(target.spyChance * 100)) })]),
              ]}
              actions={
                <Button
                  disabled={busy || !hasAp(castle, cost.ap) || !affords(castle, purse, cost.gold)}
                  onClick={() => void castleAct({ type: 'spy', target: target.id, mission: m.id })}
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
