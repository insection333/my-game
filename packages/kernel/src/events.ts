// Events: what happened, announced by the kernel and by features. Goals, the away recap, notices,
// moments, telemetry and the live channel all read the same events. Levels, mastery steps, finds,
// goals and deeds are the notable moments; they are named here because every skill shares them.
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
  /** A goal was claimed; `name` is its words when they are made for it (a short goal's count), and
   *  `cache` the supply cache it paid in (its grade and what it held), for its reveal. */
  goalDone: {
    goal: string;
    name?: string;
    cache?: { grade: string; items: { item: string; count: number }[] };
  };
  /** A deed was done (session 15): its words and icon as they were when done, its tier and points, and
   *  the honours it unlocked (a title, a banner, a frame), by name. */
  deedDone: { deed: string; name: string; icon: string | null; tier: string; points: number; unlocks?: string[] };
  /** An expedition came home (step 16): where and how long, the road taken, how it ended (the boss
   *  beaten or not, or a retreat before it), the stages cleared of all, the marks and finds it brought. */
  expeditionDone: {
    region: string;
    hours: number;
    road: string;
    boss: string;
    outcome: 'won' | 'lost' | 'retreated';
    cleared: number;
    stages: number;
    marks: number;
    finds: string[];
  };
  /** A lane stopped; the reason says why, so the page can say what to do. */
  laneStopped: { lane: LaneId; action: ActionRef | null; reason: StopReason };
  /** A command was refused: what was asked, and why not, so the page can say so. */
  refused: { lane: LaneId | null; action: ActionRef | null; reason: StopReason };
  /** A queued Next action began after the current one stopped. */
  nextStarted: { lane: LaneId; action: ActionRef };
}

export type GameEvent = {
  [K in keyof EventMap]: { type: K; at: number } & EventMap[K];
}[keyof EventMap];

export type EventOf<K extends keyof EventMap> = Extract<GameEvent, { type: K }>;

/** The notable moments: what the page celebrates, telemetry counts and the luck guarantee watches. */
export const NOTABLE_EVENTS: readonly (keyof EventMap)[] = [
  'levelUp',
  'masteryStep',
  'find',
  'goalDone',
  'deedDone',
  'expeditionDone',
];
export const isNotable = (e: GameEvent): boolean => NOTABLE_EVENTS.includes(e.type);
