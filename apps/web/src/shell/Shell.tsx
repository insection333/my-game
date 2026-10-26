// The shell: header, menu, lanes and sheets around every page. It owns the layout; pages fill the
// main column and features fill slots.
import { countOf } from '@idle-clash/kernel';
import { fmt, hasString, t } from '@idle-clash/content';
import { IconButton, Pill, Sheet } from '@idle-clash/ui';
import { useEffect, useState, type ReactNode } from 'react';
import { useGame } from '../game/hooks.ts';
import { navigate, useLocation, withPanel } from '../router.ts';
import { ItemPanel } from '../pages/Items.tsx';
import { Settings, Tray, trayReadAt } from '../pages/Panels.tsx';
import { noticesOf } from '../pages/notices.ts';
import { FireBadge } from './FireBadge.tsx';
import { Bell, Coin, MenuGlyph, Person } from './glyphs.tsx';
import { LaneList, LaneStrip, laneViews } from './Lanes.tsx';
import { useCountUp } from './countUp.ts';
import { Sounds } from '../sound/Sounds.tsx';
import { Connection } from './Connection.tsx';
import { Gains } from './Gains.tsx';
import { Moments } from './Moments.tsx';
import s from './shell.module.css';

export const MENU = [
  { key: 'hearth', href: '/', label: 'menu.hearth' },
  { key: 'skills', href: '/skills', label: 'menu.skills' },
  { key: 'combat', href: '/combat', label: 'menu.combat' },
  { key: 'storehouse', href: '/storehouse', label: 'menu.storehouse' },
  { key: 'hiscores', href: '/hiscores', label: 'menu.hiscores' },
] as const;

const isCurrent = (href: string, path: string) =>
  href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);

export function Shell({ children }: { children: ReactNode }) {
  const { state, now, features } = useGame();
  const { path, panel } = useLocation();
  const lanes = laneViews(state, now, features);
  const close = () => navigate(withPanel(null));
  const gold = useCountUp(countOf(state, 'gold'));
  return (
    <div className={s.app}>
      <a className={s.skip} href="#main" data-ui="Link">
        {t('shell.skip')}
      </a>
      <header className={s.header}>
        <a className={s.wordmark} href="/" data-ui="Wordmark" onClick={(e) => (e.preventDefault(), navigate('/'))}>
          {t('shell.name')}
        </a>
        <div className={s.tools}>
          <FireBadge fireUntil={state.fireUntil} fireSince={state.fireSince} now={now} />
          <span data-slot="shell.gold" className={s.gold}>
            <Pill tone="gold">
              <Coin />
              <span className="visually-hidden">{t('shell.gold', { amount: fmt.int(countOf(state, 'gold')) })}</span>
              <span aria-hidden="true">{fmt.short(gold)}</span>
            </Pill>
          </span>
          <span data-slot="shell.tray">
            <TrayButton />
          </span>
          <IconButton label={t('shell.account')} onClick={() => navigate(withPanel('settings'))}>
            <Person />
          </IconButton>
        </div>
      </header>
      <nav className={s.menu} aria-label={t('shell.menu')} data-menu>
        {MENU.map((m) => (
          <a
            key={m.key}
            href={m.href}
            data-ui="MenuLink"
            aria-current={isCurrent(m.href, path) ? 'page' : undefined}
            className={s.menuLink}
            onClick={(e) => (e.preventDefault(), navigate(m.href))}
          >
            <MenuGlyph name={m.key} />
            <span className={s.menuLabel}>{t(m.label)}</span>
          </a>
        ))}
      </nav>
      <aside className={s.stripArea} data-strip aria-label={t('shell.lanes')}>
        <LaneStrip lanes={lanes} />
      </aside>
      <main id="main" className={s.main} data-main tabIndex={-1}>
        <div className={s.content}>{children}</div>
      </main>
      <aside className={s.lanesPanel} aria-label={t('shell.lanes')}>
        <h2 className={s.lanesTitle}>{t('shell.lanes')}</h2>
        <LaneList lanes={lanes} />
      </aside>
      <Connection />
      <Gains />
      <Sounds />
      <Moments />
      {panel === 'tray' && (
        <Sheet title={t('tray.title')} closeLabel={t('shell.close')} onClose={close} slot="tray.list">
          <Tray />
        </Sheet>
      )}
      {panel === 'item' && <ItemSheet onClose={close} />}
      {panel === 'settings' && (
        <Sheet title={t('settings.title')} closeLabel={t('shell.close')} onClose={close} slot="settings.account">
          <Settings />
        </Sheet>
      )}
      {panel === 'lanes' && (
        <Sheet title={t('shell.lanes')} closeLabel={t('shell.close')} onClose={close}>
          <LaneList lanes={lanes} />
        </Sheet>
      )}
    </div>
  );
}

/** An item's panel: its address carries the item (`?panel=item&item=pine-logs`). */
function ItemSheet({ onClose }: { onClose: () => void }) {
  const item = new URLSearchParams(location.search).get('item') ?? '';
  const title = hasString(`item.${item}`) ? t(`item.${item}`) : t('store.title');
  return (
    <Sheet title={title} closeLabel={t('shell.close')} onClose={onClose} slot="item.panel">
      <ItemPanel item={item} />
    </Sheet>
  );
}

/** The bell, with how many notices arrived since the tray was last opened here. */
function TrayButton() {
  const view = useGame();
  const [readAt, setReadAt] = useState(trayReadAt);
  useEffect(() => {
    const read = () => setReadAt(trayReadAt());
    window.addEventListener('tray-read', read);
    return () => window.removeEventListener('tray-read', read);
  }, []);
  const unread = noticesOf(view).filter((n) => n.at > readAt).length;
  const news = unread === 1 ? t('tray.unreadOne') : t('tray.unread', { count: fmt.int(unread) });
  return (
    <IconButton
      label={unread ? `${t('shell.notices')}: ${news}` : t('shell.notices')}
      badge={unread ? (unread > 9 ? '9+' : fmt.int(unread)) : undefined}
      onClick={() => navigate(withPanel('tray'))}
    >
      <Bell />
    </IconButton>
  );
}
