// What the server tells the page about Castle Clash (routes in apps/server/src/castle/): your castle synced
// to the server's now, the war chest and your reports; and today's targets. The page works everything
// else out with the same engine (costs, odds, the flank warning), so the two never disagree.
import type { Castle } from './castle.ts';
import type { Mercenary } from './mercenaries.ts';

export interface CastleReport {
  id: number;
  at: number;
  kind: string;
  data: Record<string, unknown>;
  /** The other lord's name, or null for a departed lord or a stronghold. */
  foeName: string | null;
}

export interface CastleView {
  /** Whether the lord's total level opens Castle Clash. */
  open: boolean;
  castle: Castle | null;
  now: number;
  totalLevel: number;
  warChest: number;
  logs: CastleReport[];
}

/** A lord to challenge: near your rating, or one who besieged you in the last day (session 38). */
export interface LordTarget {
  id: string;
  name: string;
  rating: number;
  /** Your spies' chance against them now. */
  spyChance: number;
  /** When they last besieged you, within the last day, or null. */
  struck: number | null;
  /** Until when their shield holds (a foe may be under one), or null. */
  shieldedUntil: number | null;
}

export interface CastleTargets {
  lords: LordTarget[];
  /** The day's five strongholds, easiest first. */
  mercenaries: Mercenary[];
}

/** An action's answer: the result, whether the request id was seen before, and the castle after it. */
export interface CastleActResponse {
  result: { ok: boolean; reason?: string } & Record<string, unknown>;
  duplicate: boolean;
  castle: CastleView;
}
