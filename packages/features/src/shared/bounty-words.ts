// A bounty done in words (session 175), as its moment and the notices tray say it.
import { fmt, t } from '@idle-clash/content';
import type { GameEvent } from '@idle-clash/kernel';

export function bountyWords(e: Extract<GameEvent, { type: 'bountyDone' }>): { title: string; body: string } {
  const foe = t(`action.combat.${e.foe}`);
  return {
    title: t(e.elite ? 'bounty.eliteDone' : 'bounty.done', { foe }),
    body:
      e.marks === 1
        ? t('bounty.donePaysOne', { gold: fmt.int(e.gold) })
        : t('bounty.donePays', { gold: fmt.int(e.gold), marks: fmt.int(e.marks) }),
  };
}
