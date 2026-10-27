// The Hearth's plaque: your rank, your total level, and the way to the next rank (the ranks are in
// shared/standing.ts, as deeds read them too).
import { fmt, t } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import { RANKS, rankAt, totalLevel } from '../shared/standing.ts';

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
