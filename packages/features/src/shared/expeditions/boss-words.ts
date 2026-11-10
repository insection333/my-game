// A boss fought alone in the lane, in words (session 72): its moment's title, what a win paid, and how
// loud it is. The moment, the notices tray and the recap all say it this way.
import { fmt, t } from '@idle-clash/content';
import type { GameEvent } from '@idle-clash/kernel';

type BossFought = Extract<GameEvent, { type: 'bossFought' }>;

export function bossFoughtWords(e: BossFought): {
  title: string;
  body: string | null;
  size: 'centre' | 'banner' | 'toast';
} {
  const boss = t(`boss.${e.boss}`);
  if (!e.won) return { title: t('boss.held', { boss }), body: null, size: 'toast' };
  const paid = [
    ...(e.gold > 0 ? [t('boss.spoils.gold', { gold: fmt.short(e.gold) })] : []),
    ...(e.drop ? [t(`item.${e.drop}`)] : []),
    ...(e.marks === 1
      ? [t('boss.spoils.marksOne')]
      : e.marks > 0
        ? [t('boss.spoils.marks', { marks: fmt.int(e.marks) })]
        : []),
  ];
  return {
    title: t(e.first ? 'boss.firstWin' : 'boss.beaten', { boss }),
    body: paid.length ? paid.join(', ') : null,
    // The first time a boss falls takes the centre of the screen; a day's win after, a banner.
    size: e.first ? 'centre' : 'banner',
  };
}
