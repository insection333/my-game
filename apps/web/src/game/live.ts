// The live channel: the server tells this page when the save changes (a command from another tab, a
// feature route). Dropped connections reopen with growing pauses; a reopened channel asks for a
// fresh read, since changes made while it was closed were not heard.
import { LIVE_PATH, type LiveMessage } from '@idle-clash/contracts';
import type { GameEvent, State } from '@idle-clash/kernel';

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

  const open = (again: boolean) => {
    if (typeof WebSocket === 'undefined') return;
    const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${scheme}//${location.host}${LIVE_PATH}`);
    socket.onopen = () => {
      pause = 1000;
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
      retry = setTimeout(() => open(true), pause);
      pause = Math.min(pause * 2, 30_000);
    };
  };
  open(false);

  return {
    close: () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    },
  };
}
