// The live channel: one WebSocket per open page, carrying what changed. The server only speaks on
// it; anything a page sends is ignored.
import type { GameEvent, State } from '@idle-clash/kernel';

export type LiveMessage =
  /** The player's state after a change made anywhere (this page, another tab, the server). */
  | { type: 'state'; state: State; now: number }
  /** What happened, for moments and notices. */
  | { type: 'events'; events: GameEvent[] };

export const LIVE_PATH = '/api/live';
