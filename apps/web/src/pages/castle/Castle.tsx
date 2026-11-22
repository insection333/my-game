// Castle Clash (docs/castle-clash/, IA.md): five tabs, the War first, where every battle of the day is
// (session 40), then the Army, the Citadel, the Halls and the Reports (session 42), as a bar of the
// castle's pictures that stays at the top as the page scrolls (session 133); under it the keep: the
// castle's banner (session 41) and its header (AP, the Call to arms, the orders of the day, the decree,
// shields) as one card, side by side where there is room. Before total level 100 the page says when it
// opens; at 100 a lord raises their castle here. The tabs' old addresses still lead to them.
import { fmt, t, UNLOCKS } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { Button, Panel, ProgressBar } from '@idle-clash/ui';
import type { ReactNode } from 'react';
import { useLocation } from '../../router.ts';
import { PageHead } from '../PageHead.tsx';
import { Citadel } from './Citadel.tsx';
import { Army } from './Army.tsx';
import { Banner } from './Banner.tsx';
import { Header } from './Header.tsx';
import { CastleNav } from './Nav.tsx';
import { Halls } from './Halls.tsx';
import { ReportSheet } from './Account.tsx';
import { ReportsTab } from './ReportsTab.tsx';
import { castleAct, useCastleLoad } from './store.ts';
import { useSyncedCastle } from './synced.ts';
import { War } from './War.tsx';
import s from './castle.module.css';

export const CASTLE_TABS = ['war', 'army', 'citadel', 'halls', 'reports'] as const;
type Tab = (typeof CASTLE_TABS)[number];
const PATH: Record<Tab, string> = {
  war: '/castle',
  army: '/castle/army',
  citadel: '/castle/citadel',
  halls: '/castle/halls',
  reports: '/castle/reports',
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
  reports: 'castle.tab.reports',
};

/** That lords may besiege you, and from how many days on (a count, with its one-form). */
const lordsLine = (days: number) =>
  days === 1 ? t('castle.brings.lordsOne') : t('castle.brings.lords', { days: fmt.int(days) });

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
                {/* The war of the first day first (session 169: the page led with the edict and ended on being
                    raided, though since session 167 a castle has the day's foes and its spies at once). */}
                <li>{t('castle.brings.war')}</li>
                <li>{t('castle.brings.ap')}</li>
                <li>{t('castle.brings.edict')}</li>
                <li>{lordsLine(UNLOCKS.LORDS_AFTER_DAYS)}</li>
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
  const tabs = CASTLE_TABS.map((id) => ({ id, href: PATH[id], label: t(LABEL[id]) }));
  return (
    <>
      {head()}
      <CastleNav tabs={tabs} current={tab} />
      <div className={s.column}>
        <section data-section className={s.keep}>
          <Banner />
          <Header note={E.tabOpen(castle, tab) ? null : t('castle.opens.halls')} overview={tab === 'war'} />
        </section>
        {!E.tabOpen(castle, tab) ? null : tab === 'war' ? (
          <War />
        ) : tab === 'army' ? (
          <Army />
        ) : tab === 'citadel' ? (
          <Citadel />
        ) : tab === 'halls' ? (
          <Halls />
        ) : (
          <ReportsTab />
        )}
      </div>
      {panel === 'report' && <ReportSheet />}
    </>
  );
}
