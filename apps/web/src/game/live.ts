// The live channel: the server tells this page when the save changes (a command from another tab, a
// feature route). Dropped connections reopen with growing pauses; a reopened channel asks for a
// fresh read, since changes made while it was closed were not heard. A player may hold a few pages
// open; past that the server closes their oldest (4408), which waits until the player comes back to it
// rather than reopening at once, or many tabs would close each other for ever.
import { LIVE_PATH, type LiveMessage } from '@idle-clash/contracts';
import type { GameEvent, State } from '@idle-clash/kernel';
import { setConnected } from './connection.ts';

export interface LiveHandlers {
  state: (state: State, now: number) => void;
  /** What a change just written brought about (for the notices tray). */
  events: (events: GameEvent[]) => void;
  signedOut: () => void;
  reopened: () => void;
}

export function openLive(on: LiveHandlers): { close: () => void } {
  let socket: WebSocket | null = null;
  let closed = false;
  let pause = 1000;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let resting = false;
  const back = () => {
    if (!resting || closed || document.visibilityState !== 'visible') return;
    resting = false;
    open(true);
  };

  const open = (again: boolean) => {
    if (typeof WebSocket === 'undefined') return;
    const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${scheme}//${location.host}${LIVE_PATH}`);
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
      } catch {
        /* A message this page cannot read is skipped; the next read corrects it. */
      }
    };
    socket.onclose = (e: CloseEvent) => {
      if (closed) return;
      if (e.code === 4401) return on.signedOut();
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

  return {
    close: () => {
      closed = true;
      document.removeEventListener('visibilitychange', back);
      if (retry) clearTimeout(retry);
      socket?.close();
    },
  };
}
