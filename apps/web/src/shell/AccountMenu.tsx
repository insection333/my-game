// The account menu (session 130, the owner): the player's picture at the top right opens a small popup of
// the places that are theirs: the hiscores (which on a phone have no room in the menu at the foot), their
// deeds, their own profile card and Settings. A cross in its top right, Escape, a press outside it or
// choosing a place closes it; Escape hands the focus back to the picture; so does the focus leaving it (Tab
// past its last place), where it stayed open over the page the focus had gone on to (session 132).
import { t } from '@idle-clash/content';
import type { PlaqueView } from '@idle-clash/features';
import { CloseButton, Picture } from '@idle-clash/ui';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useGame } from '../game/hooks.ts';
import { useSession } from '../game/session.ts';
import { navigate, useLocation, withPanel } from '../router.ts';
import { fills } from '../slots.tsx';
import { Cog, MenuGlyph, Medal, Person } from './glyphs.tsx';
import s from './account.module.css';

/** The address of the player's own profile card, over the page they are on. */
function profileHref(name: string): string {
  const url = new URL(withPanel('player'), location.origin);
  url.searchParams.set('name', name);
  return url.pathname + url.search;
}

export function AccountMenu() {
  const { state, now, features } = useGame();
  const { player } = useSession();
  const { path } = useLocation();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const id = useId();
  const [plaque] = fills<PlaqueView>(features, 'hearth.plaque', state, now);

  useEffect(() => {
    if (!open) return;
    pop.current?.querySelector<HTMLElement>('a')?.focus();
    const outside = (e: PointerEvent) => {
      const at = e.target as Node;
      if (!pop.current?.contains(at) && !button.current?.contains(at)) setOpen(false);
    };
    const shut = () => setOpen(false);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('popstate', shut);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('popstate', shut);
    };
  }, [open]);

  const close = (focus: boolean) => {
    setOpen(false);
    if (focus) button.current?.focus();
  };
  const go = (href: string) => {
    setOpen(false);
    navigate(href);
  };
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') return close(true);
    const links = Array.from(pop.current?.querySelectorAll<HTMLElement>('a') ?? []);
    const at = links.indexOf(document.activeElement as HTMLElement);
    const to =
      e.key === 'ArrowDown'
        ? at + 1
        : e.key === 'ArrowUp'
          ? at - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? -1
              : null;
    if (to === null || !links.length) return;
    e.preventDefault();
    links[(to + links.length) % links.length].focus();
  };

  const entries = [
    { key: 'hiscores', href: '/hiscores', label: t('menu.hiscores'), glyph: <MenuGlyph name="hiscores" /> },
    { key: 'deeds', href: '/hiscores/deeds', label: t('deeds.title'), glyph: <Medal /> },
    ...(player
      ? [{ key: 'profile', href: profileHref(player.name), label: t('account.profile'), glyph: <Person /> }]
      : []),
    { key: 'settings', href: withPanel('settings'), label: t('settings.title'), glyph: <Cog /> },
  ];
  const onHiscores = path === '/hiscores' || path.startsWith('/hiscores/');

  return (
    <span className={s.account}>
      <button
        ref={button}
        type="button"
        data-ui="AccountButton"
        className={s.button}
        aria-label={t('shell.account')}
        title={t('shell.account')}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        data-current={onHiscores ? true : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        {plaque ? (
          <Picture picture={plaque.data.picture} frame={plaque.data.frame} size={32} />
        ) : (
          <span className={s.glyph}>
            <Person />
          </span>
        )}
      </button>
      {open && (
        <div
          ref={pop}
          id={id}
          role="dialog"
          aria-label={t('shell.account')}
          className={s.pop}
          onKeyDown={keys}
          onBlur={(e) => {
            const to = e.relatedTarget as Node | null;
            if (to && !pop.current?.contains(to) && !button.current?.contains(to)) setOpen(false);
          }}
        >
          <div className={s.head}>
            <span className={s.name}>{player?.name ?? t('shell.account')}</span>
            <CloseButton label={t('shell.close')} onClick={() => close(true)} />
          </div>
          <ul className={s.list}>
            {entries.map((e) => (
              <li key={e.key}>
                <a
                  href={e.href}
                  data-ui="AccountLink"
                  className={s.link}
                  aria-current={e.href === path ? 'page' : undefined}
                  onClick={(ev) => (ev.preventDefault(), go(e.href))}
                >
                  {e.glyph}
                  <span>{e.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
}
