// When Castle Clash and its tabs open (DESIGN.md section 6): the page at total level 100, the Citadel and
// the Garrison at once, Incursions once a unit reaches level 3, the War Room at an average castle level
// of 5, the Halls (the Reliquary and the War College) with the first war mark earned.
import { UNIT_IDS, UNLOCKS } from '@idle-clash/content';
import type { Castle } from './castle.ts';
import { avgLevel } from './economy.ts';

export const castleOpen = (totalLevel: number): boolean => totalLevel >= UNLOCKS.TOTAL_LEVEL;

export type CastleTab = 'citadel' | 'garrison' | 'warRoom' | 'incursions' | 'halls';

export function tabOpen(c: Castle, tab: CastleTab): boolean {
  switch (tab) {
    case 'citadel':
    case 'garrison':
      return true;
    case 'incursions':
      return UNIT_IDS.some((u) => c.levels[u] >= UNLOCKS.INCURSIONS_UNIT_LEVEL);
    case 'warRoom':
      return avgLevel(c) >= UNLOCKS.WAR_ROOM_AVG_LEVEL;
    case 'halls':
      return c.warMarksEarned >= UNLOCKS.RELIQUARY_MARKS_EARNED;
  }
}
