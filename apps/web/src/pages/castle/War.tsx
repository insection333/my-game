// The War (IA.md, Castle Clash; session 40): every battle of the day on one tab, each a press away. The
// fortress at your tier, the day's five strongholds and the lords to challenge, each row with its chance,
// what it pays and its button; an attack goes in the formation set against the foe where the foe is known
// (no setting it first), and its result lands on its own row, with the battle's account a tap away. Your
// reports under the lords (session 133). A lord's Plan opens their sheet: spies, the full plan, Report this
// player; a stronghold's and the fortress's Send spies, theirs (session 167). Since session 170 every foe
// is a card in one full-width ladder (FoeCard.tsx).
import { UNLOCKS, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Panel, Pill } from '@idle-clash/ui';
import { useEffect } from 'react';
import { navigate, useLocation, withPanel } from '../../router.ts';
import { Fortress } from './Fortress.tsx';
import { Legend, LegendSheet } from './Legend.tsx';
import { fortressName, mercName } from './labels.ts';
import { LatestReports } from './ReportsTab.tsx';
import { loadTargets } from './store.ts';
import { useSyncedCastle } from './synced.ts';
import { FoeList } from './FoeCard.tsx';
import { TargetRow } from './TargetRow.tsx';
import { TargetSheet } from './TargetSheet.tsx';
import type { Target } from './targets.ts';
import s from './castle.module.css';
import w from './war.module.css';

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
  const { castle, now } = useSyncedCastle();
  const { lords, strongholds, reach } = useTargets();
  const id = panel === 'target' ? new URLSearchParams(location.search).get('target') : null;
  const open = id ? [...lords, ...strongholds, ...fortressTarget(castle)].find((x) => x.id === id) : undefined;
  // Lords not yet open, or none in reach: a line folded under the strongholds rather than a panel of its
  // own (session 170: a panel for a line stood alone beside the fortress, and left a desktop's right empty).
  const lordsLine =
    !castle || lords.length > 0
      ? null
      : !E.lordsOpen(castle, now)
        ? t('castle.lords.opens', {
            time: fmt.duration(E.lordsOpenAt(castle) - now),
            level: fmt.int(UNLOCKS.LORDS_AVG_LEVEL),
            now: fmt.num(Math.floor(E.avgLevel(castle) * 10) / 10),
          })
        : t('castle.targets.none');
  return (
    <div className={w.war}>
      {/* Every foe of the day in one ladder, full width (session 170): the fortress, the strongholds, the
          lords, then what came of the war, so no column ends early beside another. */}
      <Fortress />
      {/* The season's legendary siege (session 220). */}
      <Legend />
      <Strongholds strongholds={strongholds} lordsLine={lordsLine} />
      {lords.length > 0 && <Lords lords={lords} reach={reach} />}
      <LatestReports />
      {id?.startsWith('legend:') && (
        <LegendSheet onClose={() => navigate(withPanel(null).replace(/[?&]target=[^&]*/, ''))} />
      )}
      {open && <TargetSheet target={open} onClose={() => navigate(withPanel(null).replace(/[?&]target=[^&]*/, ''))} />}
    </div>
  );
}

function Strongholds({ strongholds, lordsLine }: { strongholds: Target[]; lordsLine: string | null }) {
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
        {/* Five cards: on a short screen they scroll inside the panel. */}
        <FoeList slot="castle.strongholds" label={t('castle.strongholds.title')}>
          {strongholds.map((x) => (
            <TargetRow key={x.id} target={x} />
          ))}
        </FoeList>
        <p className={s.note}>{t('castle.strongholds.note')}</p>
        {lordsLine && (
          <p className={w.lords} data-slot="castle.targets">
            {lordsLine}
          </p>
        )}
      </Panel>
    </section>
  );
}

function Lords({ lords, reach }: { lords: Target[]; reach: number }) {
  return (
    <section data-section>
      <Panel title={t('castle.targets.title')} flush>
        <FoeList slot="castle.targets" label={t('castle.targets.title')}>
          {lords.map((x) => (
            <TargetRow key={x.id} target={x} />
          ))}
        </FoeList>
        {reach > 0 && <p className={s.note}>{t('castle.targets.wider')}</p>}
      </Panel>
    </section>
  );
}
