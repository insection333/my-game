// The shell: header, menu, lanes and sheets around every page. It owns the layout; pages fill the
// main column and features fill slots.
import { countOf } from '@idle-clash/kernel';
import { fmt, hasString, t } from '@idle-clash/content';
import { IconButton, Pill, Sheet } from '@idle-clash/ui';
import type { ReactNode } from 'react';
import { useGame } from '../game/hooks.ts';
import { navigate, useLocation, withPanel } from '../router.ts';
import { ItemPanel } from '../pages/Items.tsx';
import { Settings, Tray } from '../pages/Panels.tsx';
import { FireBadge } from './FireBadge.tsx';
import { Bell, Coin, MenuGlyph, Person } from './glyphs.tsx';
import { LaneList, LaneStrip, laneViews } from './Lanes.tsx';
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
  const { state, now } = useGame();
  const { path, panel } = useLocation();
  const lanes = laneViews(state, now);
  const close = () => navigate(withPanel(null));
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
          <FireBadge fireUntil={state.fireUntil} now={now} />
          <span data-slot="shell.gold" className={s.gold}>
            <Pill tone="gold">
              <Coin />
              <span className="visually-hidden">{t('shell.gold', { amount: fmt.int(countOf(state, 'gold')) })}</span>
              <span aria-hidden="true">{fmt.short(countOf(state, 'gold'))}</span>
            </Pill>
          </span>
          <span data-slot="shell.tray">
            <IconButton label={t('shell.notices')} onClick={() => navigate(withPanel('tray'))}>
              <Bell />
            </IconButton>
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
