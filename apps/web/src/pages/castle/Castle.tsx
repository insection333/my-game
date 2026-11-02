// Castle Clash (docs/castle-clash/, IA.md): the castle's header (AP, the Call to arms, the treasury, the
// decree, shields) over five tabs, each opening as the castle grows. Before total level 100 the page says
// when it opens; at 100 a lord raises their castle here.
import { fmt, t, UNLOCKS } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Button, Panel, ProgressBar, Tabs } from '@idle-clash/ui';
import type { ReactNode } from 'react';
import { navigate, useLocation } from '../../router.ts';
import { PageHead } from '../PageHead.tsx';
import { Citadel } from './Citadel.tsx';
import { Garrison } from './Garrison.tsx';
import { Header } from './Header.tsx';
import { Incursions } from './Incursions.tsx';
import { Halls } from './Halls.tsx';
import { Reports, ReportSheet } from './Reports.tsx';
import { castleAct, useCastleLoad } from './store.ts';
import { useSyncedCastle } from './synced.ts';
import { WarRoom } from './WarRoom.tsx';
import s from './castle.module.css';

export const CASTLE_TABS = ['citadel', 'garrison', 'warRoom', 'incursions', 'halls'] as const;
type Tab = (typeof CASTLE_TABS)[number];
const PATH: Record<Tab, string> = {
  citadel: '/castle',
  garrison: '/castle/garrison',
  warRoom: '/castle/war-room',
  incursions: '/castle/incursions',
  halls: '/castle/halls',
};
export const castleTab = (path: string): Tab | null =>
  (Object.entries(PATH).find(([, p]) => p === path)?.[0] as Tab | undefined) ?? null;

const LABEL: Record<Tab, string> = {
  citadel: 'castle.tab.citadel',
  garrison: 'castle.tab.garrison',
  warRoom: 'castle.tab.warRoom',
  incursions: 'castle.tab.incursions',
  halls: 'castle.tab.halls',
};
const SHORT: Partial<Record<Tab, string>> = {
  warRoom: 'castle.tab.warRoom.short',
  incursions: 'castle.tab.incursions.short',
};

export function Castle({ path }: { path: string }) {
  const tab = castleTab(path) ?? 'citadel';
  const { panel } = useLocation();
  useCastleLoad();
  const { view, castle, now } = useSyncedCastle();
  const head = (children?: ReactNode) => <PageHead title={t('castle.title')}>{children}</PageHead>;
  if (!view) return head();
  if (!view.open || !castle)
    return (
      <>
        {head()}
        <section data-section>
          <Panel>
            <div data-slot="castle.lead" className={s.raise}>
              {view.open ? (
                <p className={s.lead}>{t('castle.raise.lead')}</p>
              ) : (
                <div className={s.locked}>
                  <p>{t('castle.locked', { level: fmt.int(UNLOCKS.TOTAL_LEVEL), now: fmt.int(view.totalLevel) })}</p>
                  <ProgressBar
                    value={Math.min(1, view.totalLevel / UNLOCKS.TOTAL_LEVEL)}
                    label={t('castle.locked', { level: fmt.int(UNLOCKS.TOTAL_LEVEL), now: fmt.int(view.totalLevel) })}
                  />
                </div>
              )}
              <ul className={s.brings}>
                <li>{t('castle.brings.edict')}</li>
                <li>{t('castle.brings.ap')}</li>
                <li>{t('castle.brings.war')}</li>
              </ul>
              {view.open && (
                <Button variant="primary" onClick={() => void castleAct('open')}>
                  {t('castle.raise')}
                </Button>
              )}
            </div>
          </Panel>
        </section>
      </>
    );
  const tabs = CASTLE_TABS.map((id) => ({
    href: PATH[id],
    label: t(LABEL[id]),
    ...(SHORT[id] ? { short: t(SHORT[id]) } : {}),
    current: id === tab,
  }));
  return (
    <>
      {head(<Tabs tabs={tabs} label={t('castle.title')} onNavigate={navigate} />)}
      <div className={s.column}>
        <Header note={E.tabOpen(castle, tab) ? null : opens(castle, tab)} />
        {!E.tabOpen(castle, tab) ? (
          // A lord may be attacked before their own War room opens: their reports are here all the same.
          tab === 'warRoom' && <Reports logs={view.logs} now={now} />
        ) : tab === 'citadel' ? (
          <Citadel />
        ) : tab === 'garrison' ? (
          <Garrison />
        ) : tab === 'warRoom' ? (
          <WarRoom />
        ) : tab === 'incursions' ? (
          <Incursions />
        ) : (
          <Halls />
        )}
      </div>
      {panel === 'report' && <ReportSheet />}
    </>
  );
}

/** What opens a tab not yet open. */
function opens(c: E.Castle, tab: Tab): string {
  if (tab === 'incursions') return t('castle.opens.incursions', { level: fmt.int(UNLOCKS.INCURSIONS_UNIT_LEVEL) });
  if (tab === 'warRoom')
    return t('castle.opens.warRoom', {
      level: fmt.int(UNLOCKS.WAR_ROOM_AVG_LEVEL),
      now: fmt.num(Math.floor(E.avgLevel(c) * 10) / 10),
    });
  return t('castle.opens.halls');
}
