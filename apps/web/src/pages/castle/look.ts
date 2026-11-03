// How the castle's banner draws a castle (session 41; CastleScene, ART.md): its walls' material from the
// walls' level, its keep's storeys from the castle's average level, its towers from the watchtower's,
// the edict flying only while the treasury pays for it, the walls' damage, and fires and a camp outside
// after a siege in the last hours.
import { castleEngine as E } from '@idle-clash/features';
import type { CastleLook } from '@idle-clash/ui';

/** How long a siege's fires burn on the banner after it. */
export const BESIEGED_MS = 6 * 60 * 60 * 1000;
const BANNERS = ['harvest', 'vigor', 'fortune'] as const;

export function lookOf(castle: E.Castle, totalLevel: number, logs: E.CastleReport[], now: number): CastleLook {
  const edict = BANNERS.find((b) => b === castle.edict) ?? null;
  return {
    walls: castle.levels.walls,
    keep: E.avgLevel(castle),
    towers: castle.levels.watchtower,
    banner: edict && E.edictBonusPct(castle, totalLevel) > 0 ? edict : null,
    integrity: castle.wallIntegrity,
    besieged: logs.some((r) => r.kind === 'siegeIn' && r.at <= now && now - r.at < BESIEGED_MS),
  };
}
