// A notice pressed while the game is open in a tab (session 302): the worker tells the tab where to go
// (`public/sw.js`), and the tab goes there in place, keeping a letter half written and the presses still waiting
// to be sent, where the worker loaded it afresh. Only a page of this site is taken, as the worker does.
import { navigate } from './router.ts';

export const OPEN = 'idle-clash:open';

export function openFromNotice(data: unknown, go: (url: string) => void = navigate): void {
  if (typeof data !== 'object' || data === null) return;
  const { type, url } = data as { type?: unknown; url?: unknown };
  if (type === OPEN && typeof url === 'string' && /^\/(?![/\\])/.test(url)) go(url);
}

/** Listens for the worker's word, once, from the page's start. */
export function hearNotices(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', (e: MessageEvent) => openFromNotice(e.data));
}
