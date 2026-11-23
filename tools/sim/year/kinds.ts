// The year's players and what a year of play records (moved from player.ts in session 215): each kind's
// visits, and each day's events, firsts, idle lanes, gold, marks and the deepest reached in the Deep.
import type { GameEvent, State } from '@idle-clash/kernel';
import type { CastleDay } from './castle.ts';

export interface Kind {
  name: string;
  /** Each visit: the hour of the day it starts, and its minutes. */
  visits: { hour: number; minutes: number }[];
  /** From which day it sends its fighter on expeditions overnight. */
  expeditionsFrom: number;
  /** Whether it raises a castle at total level 100 and keeps its edict (Castle Clash, session 33). */
  castle: boolean;
}
export const STEADY: Kind = {
  name: 'The steady player',
  visits: [{ hour: 0, minutes: 60 }],
  expeditionsFrom: 14,
  castle: true,
};
export const LIGHT: Kind = {
  name: 'The light player',
  visits: [
    { hour: 0, minutes: 10 },
    { hour: 12, minutes: 5 },
  ],
  expeditionsFrom: 21,
  castle: true,
};

export interface YearDay {
  day: number;
  /** Notable events during the day's visits, and all the day's notable events. */
  active: GameEvent[];
  events: GameEvent[];
  /** What was new: a level, a tier, a mastery step, a deed, a title, a boss, a relic, a find, a Kindling. */
  firsts: string[];
  /** Seconds each lane stood idle while away, and why lanes stopped. */
  idle: Record<string, number>;
  stops: Record<string, number>;
  gold: number;
  /** Expedition marks held, unspent (session 209), and the deepest reached in the Deep (session 215). */
  marks: number;
  deepest?: number;
  slots: [number, number];
  /** What each lane was left running (and what was queued). */
  lanes?: Record<string, string>;
  /** The castle at the day's last visit, once raised. */
  castle?: CastleDay;
}
export interface Year {
  kind: Kind;
  days: YearDay[];
  /** The day each skill reached 99. */
  at99: Record<string, number>;
  final: State;
  commands: number;
  refused: number;
  /** Refusals by command and reason. */
  why: Record<string, number>;
}
