// Events: what happened, announced by the kernel and by features. Goals, the away recap, notices,
// telemetry and the live channel all read the same events.
//
// Features add their own kinds by augmenting EventMap:
//   declare module '@idle-clash/kernel' { interface EventMap { find: { item: string; rarity: string } } }
import type { ActionRef, LaneId, StopReason } from './schema.ts';

export interface EventMap {
  /** A lane stopped; the reason says why, so the page can say what to do. */
  laneStopped: { lane: LaneId; action: ActionRef | null; reason: StopReason };
  /** A queued Next action began after the current one stopped. */
  nextStarted: { lane: LaneId; action: ActionRef };
}

export type GameEvent = {
  [K in keyof EventMap]: { type: K; at: number } & EventMap[K];
}[keyof EventMap];

export type EventOf<K extends keyof EventMap> = Extract<GameEvent, { type: K }>;
