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

export function useLocation(): { path: string; panel: string | null } {
  const at = useSyncExternalStore(subscribe, snapshot);
  const url = new URL(at, 'http://x');
  return { path: url.pathname.replace(/\/$/, '') || '/', panel: url.searchParams.get('panel') };
}

/** The current address with a panel opened or closed. */
export function withPanel(panel: string | null): string {
  const url = new URL(location.href);
  if (panel) url.searchParams.set('panel', panel);
  else url.searchParams.delete('panel');
  return url.pathname + url.search;
}
