// Events: what happened, announced by the kernel and by features. Goals, the away recap, notices,
// moments, telemetry and the live channel all read the same events. Levels, mastery steps, finds and
// goals are the notable moments; they are named here because every skill shares them.
//
// Features add their own kinds by augmenting EventMap:
//   declare module '@idle-clash/kernel' { interface EventMap { find: { item: string; rarity: string } } }
import type { ActionRef, LaneId, StopReason } from './schema.ts';

export type Rarity = 'uncommon' | 'rare' | 'legendary';

export interface EventMap {
  /** A skill reached a new level (and whatever that level unlocks). */
  levelUp: { skill: string; level: number };
  /** An action reached a new mastery step. */
  masteryStep: { action: ActionRef; step: number };
  /** A find; `first` when it is new to the collection log. */
  find: { skill: string; item: string; rarity: Rarity; first: boolean };
  /** A goal was claimed. */
  goalDone: { goal: string };
  /** A lane stopped; the reason says why, so the page can say what to do. */
  laneStopped: { lane: LaneId; action: ActionRef | null; reason: StopReason };
  /** A queued Next action began after the current one stopped. */
  nextStarted: { lane: LaneId; action: ActionRef };
}

export type GameEvent = {
  [K in keyof EventMap]: { type: K; at: number } & EventMap[K];
}[keyof EventMap];

export type EventOf<K extends keyof EventMap> = Extract<GameEvent, { type: K }>;

/** The notable moments: what the page celebrates, telemetry counts and the luck guarantee watches. */
export const NOTABLE_EVENTS: readonly (keyof EventMap)[] = ['levelUp', 'masteryStep', 'find', 'goalDone'];
export const isNotable = (e: GameEvent): boolean => NOTABLE_EVENTS.includes(e.type);
