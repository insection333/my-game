// When this player last opened the tray in this browser (kept for each player, session 204): notices after
// it count as new on the bell. Where this browser keeps nothing, the count stays until the next visit.
import { keep, kept } from '../kept.ts';

const READ_KEY = 'trayRead';
export const trayReadAt = (): number => Number(kept(READ_KEY) ?? 0);

export function noteTrayRead(at: number): void {
  keep(READ_KEY, String(at));
  window.dispatchEvent(new Event('tray-read'));
}
