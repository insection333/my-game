// When Castle Clash and its tabs open (DESIGN.md section 6; session 40). The page at total level 100; at
// once the War (incursions and the day's strongholds), the Army and the Citadel; lords to besiege and spy
// on at an average castle level of 5; the Halls (the Reliquary and the War College) with the first war mark.
import { UNLOCKS } from '@idle-clash/content';
import type { Castle } from './castle.ts';
import { avgLevel } from './economy.ts';

export const castleOpen = (totalLevel: number): boolean => totalLevel >= UNLOCKS.TOTAL_LEVEL;

export type CastleTab = 'war' | 'army' | 'citadel' | 'halls';

/** Whether other lords may be besieged and spied on (and may be targets in turn: the novice shield aside). */
export const lordsOpen = (c: Castle): boolean => avgLevel(c) >= UNLOCKS.LORDS_AVG_LEVEL;

export function tabOpen(c: Castle, tab: CastleTab): boolean {
  return tab === 'halls' ? c.warMarksEarned >= UNLOCKS.RELIQUARY_MARKS_EARNED : true;
}
