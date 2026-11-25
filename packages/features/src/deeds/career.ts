// A player's career at a glance (session 44), for their profile card: total level, deed points and deeds
// done, titles earned, Kindlings, foes slain, bosses beaten and runs brought home, and their castle's
// standing (level, fortresses taken, routs; legends taken and the Deep's deepest since session 226). Read from
// their save as it stands.
import type { State } from '@idle-clash/kernel';
import { BOSSES } from '../shared/expeditions/data.ts';
import { totalLevel } from '../shared/standing.ts';
import { HONOURS, unlocked } from './honours.ts';
import { deedList, pointsOf } from './list.ts';
import { Reader } from './reader.ts';
import { deedsOf } from './state.ts';
import { allFinds } from '../shared/catalog.ts';

export interface Career {
  totalLevel: number;
  deedPoints: number;
  deedsDone: number;
  deedsAll: number;
  titles: number;
  kindlings: number;
  defeats: number;
  bossWins: number;
  runs: number;
  /** The deepest depth reached in the Deep (session 226), 0 before the first descent. */
  deepest: number;
  /** Lifetime records (session 242): finds in the collection log of all there are, bounties claimed, weeks'
   *  contracts kept, the pedlar's favour, and the realm's bosses fallen with their strike. */
  finds: number;
  findsAll: number;
  bounties: number;
  weeks: number;
  favour: number;
  realmFallen: number;
  castle: { level: number; fortresses: number; routs: number; legends: number } | null;
}

export function careerOf(state: State, now: number): Career {
  const r = new Reader(state, now);
  const d = deedsOf(state);
  const points = pointsOf(state);
  const list = deedList();
  return {
    totalLevel: totalLevel(state),
    deedPoints: points,
    deedsDone: list.filter((x) => Object.hasOwn(d.done, x.id)).length,
    deedsAll: list.length,
    titles: HONOURS.filter((h) => h.kind === 'title' && unlocked(h, d.done, points)).length,
    kindlings: r.allKindlings(),
    defeats: r.allDefeats(),
    bossWins: BOSSES.reduce((n, b) => n + r.bossWins(b.id), 0),
    runs: r.runs(),
    deepest: r.deepest(),
    finds: r.logged(),
    findsAll: allFinds().length,
    bounties: r.bounties(),
    weeks: r.weeksKept(),
    favour: r.favour(),
    realmFallen: r.realmFallen(),
    castle: r.castleRaised()
      ? {
          level: r.castle('level'),
          fortresses: r.castle('taken'),
          routs: r.castle('routs'),
          legends: r.castle('legends'),
        }
      : null,
  };
}
