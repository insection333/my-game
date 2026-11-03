// Castle Clash (docs/castle-clash/, IA.md): the castle's header (AP, the Call to arms, the orders of the
// day, the decree, shields) over four tabs (session 40): the War first, where every battle of the day is,
// then the Army, the Citadel and the Halls. Before total level 100 the page says when it opens; at 100 a
// lord raises their castle here. The tabs' old addresses still lead to them.
import { fmt, t, UNLOCKS } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Button, Panel, ProgressBar, Tabs } from '@idle-clash/ui';
import type { ReactNode } from 'react';
import { navigate, useLocation } from '../../router.ts';
import { PageHead } from '../PageHead.tsx';
import { Citadel } from './Citadel.tsx';
import { Army } from './Army.tsx';
import { Header } from './Header.tsx';
import { Halls } from './Halls.tsx';
import { ReportSheet } from './Reports.tsx';
import { castleAct, useCastleLoad } from './store.ts';
import { useSyncedCastle } from './synced.ts';
import { War } from './War.tsx';
import s from './castle.module.css';

export const CASTLE_TABS = ['war', 'army', 'citadel', 'halls'] as const;
type Tab = (typeof CASTLE_TABS)[number];
const PATH: Record<Tab, string> = {
  war: '/castle',
  army: '/castle/army',
  citadel: '/castle/citadel',
  halls: '/castle/halls',
};
/** The addresses of the five tabs before session 40, to the tab that holds what they held. */
const FORMER: Record<string, Tab> = {
  '/castle/garrison': 'army',
  '/castle/war-room': 'war',
  '/castle/incursions': 'war',
};
export const castleTab = (path: string): Tab | null =>
  (Object.entries(PATH).find(([, p]) => p === path)?.[0] as Tab | undefined) ??
  (Object.hasOwn(FORMER, path) ? FORMER[path] : null);

const LABEL: Record<Tab, string> = {
  war: 'castle.tab.war',
  army: 'castle.tab.army',
  citadel: 'castle.tab.citadel',
  halls: 'castle.tab.halls',
};

export function Castle({ path }: { path: string }) {
  const tab = castleTab(path) ?? 'war';
  const { panel } = useLocation();
  useCastleLoad();
  const { view, castle } = useSyncedCastle();
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
  const tabs = CASTLE_TABS.map((id) => ({ href: PATH[id], label: t(LABEL[id]), current: id === tab }));
  return (
    <>
      {head(<Tabs tabs={tabs} label={t('castle.title')} onNavigate={navigate} />)}
      <div className={s.column}>
        <Header note={E.tabOpen(castle, tab) ? null : t('castle.opens.halls')} />
        {!E.tabOpen(castle, tab) ? null : tab === 'war' ? (
          <War />
        ) : tab === 'army' ? (
          <Army />
        ) : tab === 'citadel' ? (
          <Citadel />
        ) : (
          <Halls />
        )}
      </div>
      {panel === 'report' && <ReportSheet />}
    </>
  );
}
