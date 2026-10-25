// Whether the page can reach the server: the live channel is open and the last change got through.
// The shell says so after a few seconds without it (shell/Connection.tsx); the lanes keep working
// on the server either way, and the page catches up when it is back.
import { useSyncExternalStore } from 'react';

let up = true;
const listeners = new Set<() => void>();

export function setConnected(value: boolean): void {
  if (value === up) return;
  up = value;
  for (const l of listeners) l();
}

/** Hears each change of connection (the store retries while it is down). */
export function onConnection(fn: (up: boolean) => void): () => void {
  const l = () => fn(up);
  listeners.add(l);
  return () => listeners.delete(l);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useConnected = (): boolean => useSyncExternalStore(subscribe, () => up);
