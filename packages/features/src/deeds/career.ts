// A player's career at a glance (session 44), for their profile card: total level, deed points and deeds
// done, titles earned, Kindlings, foes slain, bosses beaten and runs brought home, and their castle's
// standing (level, fortresses taken, routs). Read from their save as it stands.
import type { State } from '@idle-clash/kernel';
import { BOSSES } from '../shared/expeditions/data.ts';
import { totalLevel } from '../shared/standing.ts';
import { HONOURS, unlocked } from './honours.ts';
import { deedList, pointsOf } from './list.ts';
import { Reader } from './reader.ts';
import { deedsOf } from './state.ts';

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
  castle: { level: number; fortresses: number; routs: number } | null;
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
    castle: r.castleRaised()
      ? { level: r.castle('level'), fortresses: r.castle('taken'), routs: r.castle('routs') }
      : null,
  };
}
