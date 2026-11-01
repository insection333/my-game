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

export interface CastleTargets {
  /** Lords near your rating, each with your spies' chance against them now. */
  lords: { id: string; name: string; rating: number; spyChance: number }[];
  mercenaries: Mercenary[];
}

/** An action's answer: the result, whether the request id was seen before, and the castle after it. */
export interface CastleActResponse {
  result: { ok: boolean; reason?: string } & Record<string, unknown>;
  duplicate: boolean;
  castle: CastleView;
}
