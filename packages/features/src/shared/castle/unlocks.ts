// When Castle Clash and its tabs open (DESIGN.md section 6; session 40). The page at total level 100; at
// once the War (incursions and the day's strongholds), the Army and the Citadel; lords to besiege and spy
// on at an average castle level of 3 or two weeks after raising (session 137); the Halls (the Reliquary and the War College) with the first war mark;
// the Reports at once (session 42).
import { UNLOCKS } from '@idle-clash/content';
import type { Castle } from './castle.ts';
import { avgLevel } from './economy.ts';

export const castleOpen = (totalLevel: number): boolean => totalLevel >= UNLOCKS.TOTAL_LEVEL;

export type CastleTab = 'war' | 'army' | 'citadel' | 'halls' | 'reports';

const DAY = 86_400_000;

/** When lords open by the castle's age alone: two weeks after it was raised (session 137). */
export const lordsOpenAt = (c: Castle): number => c.createdAt + UNLOCKS.LORDS_AFTER_DAYS * DAY;

/** Whether other lords may be besieged and spied on (and may be targets in turn: the novice shield aside):
 *  at an average level of 3, or two weeks after the castle was raised, whichever is first (session 137). */
export const lordsOpen = (c: Castle, now: number): boolean =>
  avgLevel(c) >= UNLOCKS.LORDS_AVG_LEVEL || now >= lordsOpenAt(c);

export function tabOpen(c: Castle, tab: CastleTab): boolean {
  return tab === 'halls' ? c.warMarksEarned >= UNLOCKS.RELIQUARY_MARKS_EARNED : true;
}
