// Your standing: the total level, and a rank that rises with it, from a newcomer's Wanderer to the
// Legend of the Realm at every skill's top level. Ranks are spaced for the whole expansion's climb
// (docs/EXPANSION.md): close together early, so the first few come in the first days.
import { fmt, t } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import { totalLevel } from './ladder.ts';

/** Each rank and the total level it starts at. */
export const RANKS: readonly { id: string; total: number }[] = [
  { id: 'wanderer', total: 0 },
  { id: 'settler', total: 20 },
  { id: 'hand', total: 50 },
  { id: 'journeyman', total: 100 },
  { id: 'yeoman', total: 150 },
  { id: 'warden', total: 200 },
  { id: 'master', total: 280 },
  { id: 'fenwalker', total: 400 },
  { id: 'knight', total: 550 },
  { id: 'peakstrider', total: 700 },
  { id: 'ashlord', total: 850 },
  { id: 'dawnbringer', total: 1000 },
  { id: 'legend', total: 1089 },
];

export const rankAt = (total: number) => [...RANKS].reverse().find((r) => total >= r.total)!;

/** What the Hearth's banner shows: rank, total level, and how far the next rank is. */
export interface StandingView {
  rank: string;
  total: string;
  next: string | null;
  progress: number;
}

export function standingView(state: State): StandingView {
  const total = totalLevel(state);
  const rank = rankAt(total);
  const next = RANKS[RANKS.indexOf(rank) + 1];
  return {
    rank: t(`rank.${rank.id}`),
    total: t('standing.total', { level: fmt.int(total) }),
    next: next ? t('standing.next', { rank: t(`rank.${next.id}`), level: fmt.int(next.total) }) : null,
    progress: next ? (total - rank.total) / (next.total - rank.total) : 1,
  };
}
