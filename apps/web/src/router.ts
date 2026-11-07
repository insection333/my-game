// A small router: paths for pages, ?panel= for sheets over them.
import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  window.addEventListener('popstate', fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('popstate', fn);
  };
};
const snapshot = () => location.pathname + location.search;

export function navigate(href: string) {
  if (href === snapshot()) return;
  history.pushState(null, '', href);
  for (const l of listeners) l();
  window.scrollTo(0, 0);
}

/** Changes the address without adding a step to the history (a redirect). */
export function replace(href: string) {
  if (href === snapshot()) return;
  history.replaceState(null, '', href);
  for (const l of listeners) l();
}

export function useLocation(): { path: string; panel: string | null; next: string } {
  const at = useSyncExternalStore(subscribe, snapshot);
  const url = new URL(at, 'http://x');
  // Where to go after signing in: only an address on this site.
  const next = url.searchParams.get('next') ?? '/';
  return {
    path: url.pathname.replace(/\/$/, '') || '/',
    panel: url.searchParams.get('panel'),
    next: /^\/(?!\/)/.test(next) ? next : '/',
  };
}

/** The current address with a panel opened or closed. */
export function withPanel(panel: string | null): string {
  const url = new URL(location.href);
  if (panel) url.searchParams.set('panel', panel);
  else url.searchParams.delete('panel');
  return url.pathname + url.search;
}

/** The address of the tray behind the bell at one of its views (session 45); `to` starts a message to that player. */
export function trayHref(view: 'notices' | 'mail', to?: string): string {
  const url = new URL(location.href);
  url.searchParams.set('panel', 'tray');
  for (const k of ['tray', 'to', 'name']) url.searchParams.delete(k);
  if (view === 'mail') url.searchParams.set('tray', 'mail');
  if (to) url.searchParams.set('to', to);
  return url.pathname + url.search;
}
