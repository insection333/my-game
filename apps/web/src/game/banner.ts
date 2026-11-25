// The realm's banner (session 235): the line the keepers of the realm put up from the console, as this page
// holds it: read with the game, and changed by the live channel the moment an admin puts one up or takes it
// down. A banner put away is kept away for the player signed in (by the browser), until a new one goes up.
import type { Banner } from '@idle-clash/contracts';
import { useSyncExternalStore } from 'react';
import { keep, kept, keptFor } from '../kept.ts';

let banner: Banner | null = null;
/** Bumped whenever what is shown may have changed (a new banner, one put away). */
let seen = 0;
const listeners = new Set<() => void>();
const emit = () => {
  seen++;
  for (const l of listeners) l();
};

export function setBanner(b: Banner | null): void {
  if (b?.id === banner?.id && b?.until === banner?.until) return;
  banner = b;
  emit();
}

const AWAY = 'banner.away';
/** Put away on this page, for a browser that keeps nothing (a private window, storage blocked), where the
 *  cross did nothing at all (session 236): by player, as the browser keeps it. */
const awayHere = new Map<string | null, number>();

/** The banner this player should see at `now`: standing, and not put away. */
export function bannerShown(now: number): Banner | null {
  if (!banner || banner.until <= now) return null;
  return kept(AWAY) === String(banner.id) || awayHere.get(keptFor()) === banner.id ? null : banner;
}

/** Puts the banner away for this player. */
export function putAway(): void {
  if (!banner) return;
  keep(AWAY, String(banner.id));
  awayHere.set(keptFor(), banner.id);
  emit();
}

/** Re-renders when the banner changes; the caller reads `bannerShown` with its own clock. */
export const useBannerChanges = (): number =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => seen,
  );
