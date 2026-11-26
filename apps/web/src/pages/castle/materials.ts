// Whether a Level up pays up to a quarter in the lord's own materials (session 247): one switch, at the head of
// the Citadel, kept for the player in this browser and on until they turn it off.
import { useSyncExternalStore } from 'react';
import { keep, kept } from '../../kept.ts';

const KEY = 'castleMaterials';
const listeners = new Set<() => void>();
let local: boolean | null = null;

const read = (): boolean => local ?? kept(KEY) !== 'off';

export function setUseMaterials(on: boolean): void {
  // A browser that keeps nothing holds it for the page (session 236's banner, likewise).
  if (!keep(KEY, on ? 'on' : 'off')) local = on;
  for (const l of listeners) l();
}

export function useMaterials(): boolean {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  }, read);
}
