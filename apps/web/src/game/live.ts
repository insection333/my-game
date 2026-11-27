// The live channel: the server tells this page when the save changes (a command from another tab, a
// feature route). Dropped connections reopen with growing pauses; a reopened channel asks for a
// fresh read, since changes made while it was closed were not heard. A player may hold a few pages
// open; past that the server closes their oldest (4408), which waits until the player comes back to it
// rather than reopening at once, or many tabs would close each other for ever.
import { LIVE_PATH, type Banner, type LiveMessage } from '@idle-clash/contracts';
import type { GameEvent, State } from '@idle-clash/kernel';
import { setConnected } from './connection.ts';
import { shownPlayer } from '../api.ts';

export interface LiveHandlers {
  state: (state: State, now: number) => void;
  /** What a change just written brought about (for the notices tray). */
  events: (events: GameEvent[]) => void;
  /** How many letters wait, when a letter comes or letters are read (session 45). */
  mail: (unread: number) => void;
  /** The realm's banner put up or taken down (session 235). */
  banner: (banner: Banner | null) => void;
  signedOut: (why?: 'banned') => void;
  reopened: () => void;
}

/** Out of sight this long, the channel is opened afresh on return (session 281). */
export const AWAY_MS = 60_000;

export function openLive(on: LiveHandlers): { close: () => void } {
  // No live channel where there are no sockets (a test's page): the page plays through its reads alone.
  if (typeof WebSocket === 'undefined') return { close: () => undefined };
  let socket: WebSocket | null = null;
  let closed = false;
  let pause = 1000;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let resting = false;
  let hiddenAt: number | null = null;
  /** Opens a fresh channel at once in place of the one held (session 281): after a while out of sight, or the
   *  device back on a network, a socket that looks open may have no one at the other end (the server lets go of
   *  a page that stops answering, but a phone asleep never hears it close), and live news was never heard again. */
  const afresh = () => {
    if (closed || resting) return;
    if (retry) clearTimeout(retry);
    retry = null;
    if (socket) {
      socket.onclose = null;
      socket.close();
    }
    pause = 1000;
    open(true);
  };
  const back = () => {
    if (document.visibilityState !== 'visible') {
      hiddenAt = Date.now();
      return;
    }
    const away = hiddenAt !== null && Date.now() - hiddenAt >= AWAY_MS;
    hiddenAt = null;
    if (closed) return;
    if (resting) {
      resting = false;
      return open(true);
    }
    if (away) afresh();
  };

  const open = (again: boolean) => {
    const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const player = shownPlayer();
    socket = new WebSocket(
      `${scheme}//${location.host}${LIVE_PATH}${player ? `?player=${encodeURIComponent(player)}` : ''}`,
    );
    socket.onopen = () => {
      pause = 1000;
      setConnected(true);
      if (again) on.reopened();
    };
    socket.onmessage = (e: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(e.data) as LiveMessage;
        if (msg.type === 'state') on.state(msg.state, msg.now);
        else if (msg.type === 'events') on.events(msg.events);
        else if (msg.type === 'mail') on.mail(msg.unread);
        else if (msg.type === 'banner') on.banner(msg.banner);
      } catch {
        /* A message this page cannot read is skipped; the next read corrects it. */
      }
    };
    socket.onclose = (e: CloseEvent) => {
      if (closed) return;
      if (e.code === 4401) return on.signedOut();
      // A page of another player than the session's (session 208) loads afresh as the session's.
      if (e.code === 4409) return location.reload();
      // Banned (session 95): the welcome page says the account is closed.
      if (e.code === 4403) return on.signedOut('banned');
      // Closed for a newer page: commands still go through; live news waits for the player's return.
      if (e.code === 4408) {
        resting = true;
        return;
      }
      setConnected(false);
      retry = setTimeout(() => open(true), pause);
      pause = Math.min(pause * 2, 30_000);
    };
  };
  open(false);
  document.addEventListener('visibilitychange', back);
  window.addEventListener('online', afresh);

  return {
    close: () => {
      closed = true;
      document.removeEventListener('visibilitychange', back);
      window.removeEventListener('online', afresh);
      if (retry) clearTimeout(retry);
      socket?.close();
    },
  };
}
