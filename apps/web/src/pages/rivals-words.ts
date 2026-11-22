// Rivals in words (session 173): who stands just above and below you on a ladder, and the gap as you would
// close it: on a skill's ladder, in time at your best work there ("about 2 h of your Oak tree"); on Total,
// in total levels; on the season's ladder, in goals.
import type { HiscoreRow } from '@idle-clash/contracts';
import { fmt, t } from '@idle-clash/content';
import { bestIn, paces } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';

/** The gap between two entries on a ladder, as the asking player would close it. */
export function gapWords(ladder: string, you: HiscoreRow, other: HiscoreRow, state: State): string {
  const diff = Math.abs(other.xp - you.xp);
  if (ladder === 'season') return diff === 1 ? t('rival.goalsOne') : t('rival.goals', { count: fmt.int(diff) });
  if (ladder === 'total') {
    const levels = Math.abs(other.level - you.level);
    if (levels > 0) return levels === 1 ? t('rival.levelsOne') : t('rival.levels', { count: fmt.int(levels) });
    return t('rival.xp', { xp: fmt.short(diff) });
  }
  const best = bestIn(paces(state), ladder);
  if (!best || best.xpEach <= 0) return t('rival.xp', { xp: fmt.short(diff) });
  const ms = (diff / (best.xpEach / best.secondsEach)) * 1000;
  return t('rival.time', {
    time: fmt.duration(Math.max(60_000, ms)),
    action: t(`action.${best.action.feature}.${best.action.id}`),
  });
}

export interface RivalLine {
  side: 'above' | 'below';
  row: HiscoreRow;
  text: string;
}

/** The lines of the rivals strip: who is ahead and by how much, who is behind and by how much. */
export function rivalLines(
  ladder: string,
  you: HiscoreRow | null,
  near: { above: HiscoreRow | null; below: HiscoreRow | null } | undefined,
  state: State,
): RivalLine[] {
  if (!you || !near) return [];
  const out: RivalLine[] = [];
  if (near.above)
    out.push({
      side: 'above',
      row: near.above,
      text: t('rival.above', {
        name: near.above.name,
        place: fmt.ordinal(near.above.rank),
        gap: gapWords(ladder, you, near.above, state),
      }),
    });
  if (near.below)
    out.push({
      side: 'below',
      row: near.below,
      text: t('rival.below', {
        name: near.below.name,
        place: fmt.ordinal(near.below.rank),
        gap: gapWords(ladder, you, near.below, state),
      }),
    });
  return out;
}
