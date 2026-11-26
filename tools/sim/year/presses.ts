// A completionist's daily round, press by press (the plan of 26 November, D8: about 25 presses a day for one who
// does everything, a chore for an idle game). Counted from the game's own numbers, as the round stands before the
// plan and now: the castle's war is its own game, each battle a choice, so its presses stay; what the plan joined
// up (the day's bosses in one press, the realm's strike among them, Claim all, Hand in all) is one press each.
import { SIEGE } from '@idle-clash/content';
import { BOSSES } from '../../../packages/features/src/shared/expeditions/data.ts';

/** The short goals open at once, and the day's. */
const GOALS = 3 + 1;
/** The pedlar's lots a day. */
const LOTS = 3;

export interface PressRound {
  rows: { what: string; before: number; now: number }[];
  before: number;
  now: number;
}

export function pressRound(): PressRound {
  const rows = [
    { what: 'the Call to arms', before: 1, now: 1 },
    { what: "the day's strongholds and the fortress", before: SIEGE.TARGETS + 1, now: SIEGE.TARGETS + 1 },
    { what: "the bosses and the realm's strike", before: BOSSES.length + 1, now: 1 },
    { what: 'a bounty (take, fight, claim)', before: 3, now: 3 },
    { what: "the pedlar's lots", before: LOTS, now: 1 },
    { what: 'the goals and their caches', before: GOALS, now: 1 },
  ];
  return {
    rows,
    before: rows.reduce((n, r) => n + r.before, 0),
    now: rows.reduce((n, r) => n + r.now, 0),
  };
}
