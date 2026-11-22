// The War (IA.md, Castle Clash; session 40): every battle of the day on one tab, each a press away. The
// fortress at your tier, the day's five strongholds and the lords to challenge, each row with its chance,
// what it pays and its button; an attack goes in the formation set against the foe where the foe is known
// (no setting it first), and its result lands on its own row, with the battle's account a tap away. Your
// reports under the lords (session 133). A lord's Plan opens their sheet: spies, the full plan, Report this player; a stronghold's
// and the fortress's Send spies, theirs (session 167).
import { UNLOCKS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Panel, Pill } from '@idle-clash/ui';
import { useEffect } from 'react';
import { navigate, useLocation, withPanel } from '../../router.ts';
import { Fortress } from './Fortress.tsx';
import { fortressName, mercName } from './labels.ts';
import { LatestReports } from './ReportsTab.tsx';
import { loadTargets } from './store.ts';
import { useSyncedCastle } from './synced.ts';
import { TargetRow } from './TargetRow.tsx';
import { TargetSheet } from './TargetSheet.tsx';
import type { Target } from './targets.ts';
import s from './castle.module.css';

function useTargets(): { lords: Target[]; strongholds: Target[]; reach: number } {
  const { targets } = useSyncedCastle();
  useEffect(() => {
    void loadTargets(targets === null);
    // Loaded once each time the War opens; an action that changes them reloads them (store.ts).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!targets) return { lords: [], strongholds: [], reach: 0 };
  return {
    reach: targets.reach ?? 0,
    lords: targets.lords.map((l) => ({ ...l, merc: null, fortress: null })),
    strongholds: targets.mercenaries.map((m) => ({
      id: m.id,
      name: mercName(m.first, m.second),
      rating: m.rating,
      spyChance: null,
      struck: null,
      shieldedUntil: null,
      merc: m,
      fortress: null,
    })),
  };
}

/** The fortress at your tier as a target, for its sheet: its spies, its plan and Assault (session 167). */
function fortressTarget(castle: E.Castle | null): Target[] {
  if (!castle) return [];
  const tier = castle.incursionTier;
  const name = fortressName(E.fortressAt(tier).id);
  return [
    {
      id: E.fortressKey(tier),
      name,
      rating: 0,
      spyChance: null,
      struck: null,
      shieldedUntil: null,
      merc: null,
      fortress: tier,
    },
  ];
}

export function War() {
  const { panel } = useLocation();
  const { castle } = useSyncedCastle();
  const { lords, strongholds, reach } = useTargets();
  const id = panel === 'target' ? new URLSearchParams(location.search).get('target') : null;
  const open = id ? [...lords, ...strongholds, ...fortressTarget(castle)].find((x) => x.id === id) : undefined;
  return (
    <div className={s.grid}>
      {/* The day's foes on one side, the lords and what came of the war on the other (session 133), so
          neither column runs long while the other ends early. */}
      <div className={s.column}>
        <Fortress />
        <Strongholds strongholds={strongholds} />
      </div>
      <div className={s.column}>
        <Lords lords={lords} reach={reach} />
        <LatestReports />
      </div>
      {open && <TargetSheet target={open} onClose={() => navigate(withPanel(null).replace(/[?&]target=[^&]*/, ''))} />}
    </div>
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
        <div
          data-slot="castle.strongholds"
          className={s.relics}
          data-scrollbox
          tabIndex={0}
          role="group"
          aria-label={t('castle.strongholds.title')}
        >
          {strongholds.map((x) => (
            <TargetRow key={x.id} target={x} />
          ))}
        </div>
        <p className={s.note}>{t('castle.strongholds.note')}</p>
      </Panel>
    </section>
  );
}

function Lords({ lords, reach }: { lords: Target[]; reach: number }) {
  const { castle, now } = useSyncedCastle();
  if (!castle) return null;
  const open = E.lordsOpen(castle, now);
  return (
    <section data-section>
      <Panel title={t('castle.targets.title')} flush>
        <div
          data-slot="castle.targets"
          className={s.relics}
          data-scrollbox
          tabIndex={0}
          role="group"
          aria-label={t('castle.targets.title')}
        >
          {!open ? (
            <p className={s.lead}>
              {t('castle.lords.opens', {
                time: fmt.duration(E.lordsOpenAt(castle) - now),
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
        {open && reach > 0 && lords.length > 0 && <p className={s.note}>{t('castle.targets.wider')}</p>}
      </Panel>
    </section>
  );
}
