// Castle Clash's own way round (session 133, the owner: its navigation was substandard): the five tabs as
// a bar of the castle's own pictures under the title, which stays at the top of the page as it scrolls,
// so the Army's long list or the War's strongholds never leave a lord a screen from the other tabs. Each
// tab is the castle's own: the siege engines for the War, the lord's vanguard as raised for the Army, the
// walls for the Citadel, war marks (spent there) for the Halls, sealed orders for the Reports. A tab not
// yet open (the Halls before the first war mark) is drawn faint; the header says what opens it.
import { UNITS, t } from '@idle-clash/content';
import { castleEngine as E } from '@idle-clash/features';
import { ItemIcon } from '@idle-clash/ui';
import type { MouseEvent } from 'react';
import { navigate } from '../../router.ts';
import { useSyncedCastle } from './synced.ts';
import s from './castle.module.css';

export interface NavTab {
  id: E.CastleTab;
  href: string;
  label: string;
}

const PICTURE: Record<E.CastleTab, string> = {
  war: 'tech-siegecraft',
  army: '',
  citadel: 'castle-walls',
  halls: 'castle-marks',
  reports: 'spy-forge',
};

export function CastleNav({ tabs, current }: { tabs: readonly NavTab[]; current: E.CastleTab }) {
  const { castle } = useSyncedCastle();
  if (!castle) return null;
  const vanguard = UNITS.find((u) => u.id === 'vanguard') ?? UNITS[0];
  const picture = (id: E.CastleTab) =>
    id === 'army' ? vanguard.evolutions[E.evolutionOf(castle.levels[vanguard.id])] : PICTURE[id];
  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };
  return (
    <nav className={s.nav} aria-label={t('castle.title')} data-castle-nav>
      {tabs.map((x) => (
        <a
          key={x.id}
          href={x.href}
          data-ui="CastleTab"
          className={s.navTab}
          aria-current={x.id === current ? 'page' : undefined}
          data-closed={E.tabOpen(castle, x.id) ? undefined : true}
          onClick={(e) => go(e, x.href)}
        >
          <ItemIcon name={picture(x.id)} size={32} />
          <span className={s.navLabel}>{x.label}</span>
        </a>
      ))}
    </nav>
  );
}
