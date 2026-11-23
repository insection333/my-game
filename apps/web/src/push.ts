// Notices while away, on the page's side (session 171): whether this browser can take them, whether they
// are on here, and switching them on (the browser asks the player first) or off. Off until the player
// switches them on; never asked for on a first visit.
import { api } from './api.ts';
import { keep, kept } from './kept.ts';

export type PushState = 'on' | 'off' | 'blocked' | 'install' | 'unsupported';

/** An iPhone or iPad not yet installed to the Home Screen: Safari takes notices only once it is. */
const iosUninstalled = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) && !(window.matchMedia?.('(display-mode: standalone)').matches ?? false);

const supported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

async function registration(): Promise<ServiceWorkerRegistration> {
  return (await navigator.serviceWorker.getRegistration('/')) ?? navigator.serviceWorker.register('/sw.js');
}

/** How notices stand in this browser. */
export async function pushState(): Promise<PushState> {
  if (!supported()) return iosUninstalled() ? 'install' : 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'on' : 'off';
}

/** The server's key as the browser wants it. */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Switches notices on: the browser asks the player, then the server is told where to send them. */
export async function pushOn(): Promise<PushState> {
  if (!supported()) return pushState();
  const asked = await Notification.requestPermission();
  if (asked !== 'granted') return asked === 'denied' ? 'blocked' : 'off';
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const { key } = await api.push.key();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await api.push.on(json, Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  return 'on';
}

/** Switches notices off in this browser, here and on the server. */
export async function pushOff(): Promise<PushState> {
  if (!supported()) return pushState();
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await api.push.off(sub.endpoint).catch(() => undefined);
    await sub.unsubscribe();
  }
  return pushState();
}

/** The offer on a return (session 171) is made once in a browser for each player (session 204), whatever
 *  the answer; where this browser keeps nothing, it is not made at all. */
const OFFERED = 'pushOffered';
export const pushOffered = (): boolean => {
  const v = kept(OFFERED);
  return v === undefined || v === '1';
};
export const notePushOffered = (): void => void keep(OFFERED, '1');
