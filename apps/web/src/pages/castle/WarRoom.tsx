// The War room (IA.md, Castle Clash): lords to challenge (near your rating, and any who struck you in the
// last day), the day's five strongholds, and your reports. Each row carries the decision: the chance, what
// a win brings and how the target stands today (targets.ts). A target opens its sheet (TargetSheet.tsx).
import { SIEGE, fmt, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ActionRow, Button, Panel, Pill } from '@idle-clash/ui';
import { useEffect } from 'react';
import { navigate, useLocation, withPanel } from '../../router.ts';
import { mercName } from './labels.ts';
import { Reports, when } from './Reports.tsx';
import { loadTargets } from './store.ts';
import { useSyncedCastle } from './synced.ts';
import { TargetSheet } from './TargetSheet.tsx';
import { chanceLine, defenceOf, paysLine, sheetOf, standingOf, type Target } from './targets.ts';
import s from './castle.module.css';

function useTargets(): { lords: Target[]; strongholds: Target[] } {
  const { targets } = useSyncedCastle();
  useEffect(() => {
    void loadTargets(targets === null);
    // Loaded once each time the War room opens; an action that changes them reloads them (store.ts).
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

export function WarRoom() {
  const { view, now } = useSyncedCastle();
  const { panel } = useLocation();
  const { lords, strongholds } = useTargets();
  const id = panel === 'target' ? new URLSearchParams(location.search).get('target') : null;
  const open = id ? [...lords, ...strongholds].find((x) => x.id === id) : undefined;
  return (
    <div className={s.grid}>
      <div className={s.column}>
        <Lords lords={lords} />
        <Strongholds strongholds={strongholds} />
      </div>
      <Reports logs={view?.logs ?? []} now={now} />
      {open && <TargetSheet target={open} onClose={() => navigate(withPanel(null).replace(/[?&]target=[^&]*/, ''))} />}
    </div>
  );
}

function TargetRow({ target, chance }: { target: Target; chance: string }) {
  const { castle, view, now } = useSyncedCastle();
  if (!castle) return null;
  const standing = standingOf(castle, target, now);
  // A stronghold that fell says when, and nothing more is to be weighed about it today.
  const fell = standing?.kind === 'fallen';
  const taken = Math.max(0, ...E.pairOf(castle, target.id, now).sieges);
  return (
    <ActionRow
      name={target.name}
      status={
        <>
          <Pill tone={target.merc ? undefined : 'woad'}>
            {t('castle.target.rating', { rating: fmt.int(target.rating) })}
          </Pill>
          {target.struck !== null && (
            <Pill tone="ember">{t('castle.target.struckAt', { when: when(target.struck, now) })}</Pill>
          )}
          {standing && standing.kind !== 'once' && <Pill tone={fell ? 'moss' : undefined}>{standing.text}</Pill>}
        </>
      }
      facts={
        fell
          ? [t('castle.target.fellAt', { when: when(taken, now) })]
          : [
              chance,
              paysLine(castle, target, view?.warChest ?? 0, view?.logs ?? [], now),
              ...(standing?.kind === 'once' ? [standing.text] : []),
            ]
      }
      actions={
        standing && standing.kind !== 'once' ? undefined : (
          <Button onClick={() => navigate(sheetOf(target.id))}>
            {target.struck !== null ? t('castle.target.strikeBack') : t('castle.target.open')}
          </Button>
        )
      }
    />
  );
}

function Lords({ lords }: { lords: Target[] }) {
  const { castle, view, now } = useSyncedCastle();
  if (!castle) return null;
  return (
    <section data-section>
      <Panel title={t('castle.targets.title')} flush>
        <div data-slot="castle.targets">
          {lords.length === 0 && <p className={s.lead}>{t('castle.targets.none')}</p>}
          {lords.map((x) => (
            <TargetRow
              key={x.id}
              target={x}
              chance={chanceLine(castle, defenceOf(castle, x, view?.logs ?? [], now), true, now)}
            />
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Strongholds({ strongholds }: { strongholds: Target[] }) {
  const { castle, now } = useSyncedCastle();
  if (!castle || strongholds.length === 0) return null;
  const fallen = E.strongholdsFallen(castle, now);
  const total = SIEGE.STRONGHOLD_PAY.length;
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
        <div data-slot="castle.strongholds">
          {strongholds.map((x) => (
            <TargetRow key={x.id} target={x} chance={chanceLine(castle, E.mercenarySide(x.merc!), false, now)} />
          ))}
        </div>
        <p className={s.note}>{t('castle.strongholds.note')}</p>
      </Panel>
    </section>
  );
}
