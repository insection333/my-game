// The players an admin opened lately (session 234), kept by this browser for that admin, newest first, so Go
// to offers them before anything is typed: the player looked into a moment ago is a key press away.
import { keep, kept } from '../kept.ts';

/** How many are kept. */
export const RECENT = 6;
const NAME = 'console.recent';

export interface Recent {
  id: string;
  name: string;
}

/** The players opened lately, newest first; none where this browser keeps nothing. */
export function recentPlayers(): Recent[] {
  try {
    const was = JSON.parse(kept(NAME) ?? '[]') as unknown;
    return Array.isArray(was)
      ? was
          .filter(
            (x): x is Recent =>
              typeof x === 'object' &&
              x !== null &&
              typeof (x as Recent).id === 'string' &&
              typeof (x as Recent).name === 'string',
          )
          .slice(0, RECENT)
      : [];
  } catch {
    return [];
  }
}

/** A record opened: first among the recent, once. */
export function opened(p: Recent): void {
  keep(
    NAME,
    JSON.stringify([{ id: p.id, name: p.name }, ...recentPlayers().filter((x) => x.id !== p.id)].slice(0, RECENT)),
  );
}

/** A player deleted: no longer offered. */
export function forget(id: string): void {
  keep(NAME, JSON.stringify(recentPlayers().filter((x) => x.id !== id)));
}
