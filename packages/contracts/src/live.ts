// The live channel: one WebSocket per open page, carrying what changed. The server only speaks on
// it; anything a page sends is ignored.
import type { GameEvent, State } from '@idle-clash/kernel';
import type { Banner } from './console-banner.ts';

export type LiveMessage =
  /** The player's state after a change made anywhere (this page, another tab, the server). */
  | { type: 'state'; state: State; now: number }
  /** What happened, for moments and notices. */
  | { type: 'events'; events: GameEvent[] }
  /** A letter came, or letters were read (session 45): how many are unread now. */
  | { type: 'mail'; unread: number }
  /** The realm's banner put up or taken down (session 235). */
  | { type: 'banner'; banner: Banner | null };

export const LIVE_PATH = '/api/live';
