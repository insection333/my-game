// The War (IA.md, Castle Clash; session 40): every battle of the day on one tab, each a press away. The
// fortress at your tier, the day's five strongholds and the lords to challenge, each row with its chance,
// what it pays and its button; an attack goes in the formation set against the foe where the foe is known
// (no setting it first), and its result lands on its own row, with the battle's account a tap away. Your
// reports beside them. A lord's Plan opens their sheet: spies, the full plan, Report this player.
import { SINKS, SPY_MISSIONS, UNLOCKS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, ItemIcon, Panel, Pill } from '@idle-clash/ui';
import { useEffect } from 'react';
import { navigate, useLocation, withPanel } from '../../router.ts';
import { Fought } from './Fought.tsx';
import { fortressName, mercName } from './labels.ts';
import { Reports, when } from './Reports.tsx';
import { castleRun, fight, loadTargets } from './store.ts';
import { affords, hasAp, useSyncedCastle } from './synced.ts';
import { TargetSheet } from './TargetSheet.tsx';
import { defenceOf, paysLine, pct, sheetOf, standingOf, type Target } from './targets.ts';
import s from './castle.module.css';

function useTargets(): { lords: Target[]; strongholds: Target[] } {
  const { targets } = useSyncedCastle();
  useEffect(() => {
    void loadTargets(targets === null);
    // Loaded once each time the War opens; an action that changes them reloads them (store.ts).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!targets) return { lords: [], strongholds: [] };
  return {
    lords: targets.lords.map((l) => ({ ...l, merc: null })),
    strongholds: targets.mercenaries.map((m) => ({
      id: m.id,
      name: mercName(m.first, m.second),
      rating: m.rating,
      spyChance: null,
      struck: null,
      shieldedUntil: null,
      merc: m,
    })),
  };
}

export function War() {
  const { view, now } = useSyncedCastle();
  const { panel } = useLocation();
  const { lords, strongholds } = useTargets();
  const id = panel === 'target' ? new URLSearchParams(location.search).get('target') : null;
  const open = id ? [...lords, ...strongholds].find((x) => x.id === id) : undefined;
  return (
    <div className={s.grid}>
      <div className={s.column}>
        <Fortress />
        <Strongholds strongholds={strongholds} />
        <Lords lords={lords} />
      </div>
      <Reports logs={view?.logs ?? []} now={now} />
      {open && <TargetSheet target={open} onClose={() => navigate(withPanel(null).replace(/[?&]target=[^&]*/, ''))} />}
    </div>
  );
}

/** The fortress at your tier: its garrison and trap, the chance in the formation set against it, what
 *  taking it gives, and Assault. */
function Fortress() {
  const { castle, now, busy } = useSyncedCastle();
  if (!castle) return null;
  const tier = castle.incursionTier;
  const fortress = E.fortressAt(tier);
  const def = E.fortressSide(tier);
  const best = E.bestOffense(castle, def, now);
  const marks = Math.round(
    (SINKS.INCURSION_MARKS_BASE + Math.floor(tier / 2)) * E.lift(E.modifiers(castle, now).marks),
  );
  return (
    <section data-section>
      <Panel
        title={t('castle.incursion.title')}
        aside={<Pill tone="woad">{t('castle.incursion.tier', { tier: fmt.int(tier) })}</Pill>}
        flush
      >
        <div data-slot="castle.incursion">
          <ActionRow
            iconYields
            icon={<ItemIcon name="crest" crest={fortress.id} size={32} />}
            name={fortressName(fortress.id)}
            facts={[
              t('castle.target.chance', { pct: pct(E.winChance(best.r)) }),
              t('castle.incursion.rewards', { marks: fmt.int(marks) }),
            ]}
            progress={<Fought battle="incursion" />}
            actions={
              <Button
                variant="primary"
                disabled={busy || !hasAp(castle, SINKS.INCURSION_AP)}
                onClick={() => void fight('incursion', { type: 'incursion', shares: [...best.shares] })}
              >
                {t('castle.incursion.assault', { ap: fmt.int(SINKS.INCURSION_AP) })}
              </Button>
            }
          />
        </div>
      </Panel>
    </section>
  );
}

function Strongholds({ strongholds }: { strongholds: Target[] }) {
  const { castle, now } = useSyncedCastle();
  if (!castle || strongholds.length === 0) return null;
  const fallen = E.strongholdsFallen(castle, now);
  const total = strongholds.length;
  return (
    <section data-section>
      <Panel
        title={t('castle.strongholds.title')}
        aside={
          fallen >= total ? (
            <Pill tone="gold">{t('castle.strongholds.routed')}</Pill>
          ) : (
            <Pill>{t('castle.strongholds.fallen', { count: fmt.int(fallen), total: fmt.int(total) })}</Pill>
          )
        }
        flush
      >
        {/* Five rows: on a short screen they scroll inside the panel. */}
        <div data-slot="castle.strongholds" className={s.relics} data-scrollbox>
          {strongholds.map((x) => (
            <TargetRow key={x.id} target={x} />
          ))}
        </div>
        <p className={s.note}>{t('castle.strongholds.note')}</p>
      </Panel>
    </section>
  );
}

function Lords({ lords }: { lords: Target[] }) {
  const { castle } = useSyncedCastle();
  if (!castle) return null;
  const open = E.lordsOpen(castle);
  return (
    <section data-section>
      <Panel title={t('castle.targets.title')} flush>
        <div data-slot="castle.targets" className={s.relics} data-scrollbox>
          {!open ? (
            <p className={s.lead}>
              {t('castle.lords.opens', {
                level: fmt.int(UNLOCKS.LORDS_AVG_LEVEL),
                now: fmt.num(Math.floor(E.avgLevel(castle) * 10) / 10),
              })}
            </p>
          ) : lords.length === 0 ? (
            <p className={s.lead}>{t('castle.targets.none')}</p>
          ) : (
            lords.map((x) => <TargetRow key={x.id} target={x} />)
          )}
        </div>
      </Panel>
    </section>
  );
}

/** One target: a stronghold or a lord, with its chance (in the formation set against it, where it is
 *  known), what it pays, how it stands today, and its button; a lord not yet scouted offers Scout. */
function TargetRow({ target }: { target: Target }) {
  const { castle, view, now, purse, busy } = useSyncedCastle();
  if (!castle) return null;
  const logs = view?.logs ?? [];
  const standing = standingOf(castle, target, now);
  const done = standing && standing.kind !== 'once';
  const def = defenceOf(castle, target, logs, now);
  const best = def ? E.bestOffense(castle, def, now) : null;
  const chance = best ? E.winChance(best.r) : null;
  const costs = target.merc
    ? E.mercenaryCosts(castle, target.merc, now)
    : E.siegeCosts(castle, E.brRatio(castle, { rating: target.rating }), now);
  const scout = SPY_MISSIONS.find((m) => m.id === 'scout')!;
  const scoutCost = E.spyCosts(castle, { ...castle, userId: target.id, rating: target.rating }, scout, now);
  const shares = best ? ([...best.shares] as [number, number, number]) : undefined;
  const attack = () => void fight(target.id, { type: 'siege', target: target.id, ...(shares ? { shares } : {}) });
  const taken = Math.max(0, ...E.pairOf(castle, target.id, now).sieges);
  return (
    <ActionRow
      iconYields
      icon={<ItemIcon name="crest" crest={target.id} size={32} />}
      name={target.name}
      status={
        <>
          <Pill tone={target.merc ? undefined : 'woad'}>
            {t('castle.target.rating', { rating: fmt.int(target.rating) })}
          </Pill>
          {target.struck !== null && (
            <Pill tone="ember">{t('castle.target.struckAt', { when: when(target.struck, now) })}</Pill>
          )}
          {done && <Pill tone={standing.kind === 'fallen' ? 'moss' : undefined}>{standing.text}</Pill>}
        </>
      }
      facts={
        standing?.kind === 'fallen'
          ? [t('castle.target.fellAt', { when: when(taken, now) })]
          : [
              chance === null
                ? t('castle.target.unscouted')
                : target.merc
                  ? t('castle.target.chance', { pct: pct(chance) })
                  : t('castle.target.chanceAbout', { pct: pct(chance) }),
              paysLine(castle, target, view?.warChest ?? 0, logs, now),
              ...(standing?.kind === 'once' ? [standing.text] : []),
            ]
      }
      progress={<Fought battle={target.id} />}
      actions={
        done ? undefined : (
          <>
            {!target.merc && (
              <Button variant="quiet" onClick={() => navigate(sheetOf(target.id))}>
                {t('castle.target.open')}
              </Button>
            )}
            {!target.merc && chance === null ? (
              <Button
                disabled={busy || !hasAp(castle, scoutCost.ap) || !affords(castle, purse, scoutCost.gold)}
                onClick={() => void castleRun({ type: 'spy', target: target.id, mission: 'scout' })}
              >
                {t('castle.scoutFor', { gold: fmt.short(scoutCost.gold), ap: fmt.int(scoutCost.ap) })}
              </Button>
            ) : (
              <Button
                disabled={busy || !hasAp(castle, costs.ap) || !affords(castle, purse, costs.gold)}
                onClick={attack}
              >
                {t(target.struck !== null ? 'castle.strikeBackFor' : 'castle.siege', {
                  gold: fmt.short(costs.gold),
                  ap: fmt.int(costs.ap),
                })}
              </Button>
            )}
          </>
        )
      }
    />
  );
}
