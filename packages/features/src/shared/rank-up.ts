// A climb on the hiscores (session 49) in words, as the moment and the notices say it: "3rd on the
// Woodcutting hiscores. Into the top three."; with the ladder's icon and where it is.
import { fmt, t } from '@idle-clash/content';
import type { GameEvent } from '@idle-clash/kernel';

const BAND: Record<number, string> = {
  1: 'rankUp.first',
  3: 'rankUp.top3',
  10: 'rankUp.top10',
  50: 'rankUp.top50',
  100: 'rankUp.top100',
};

export function rankUpWords(e: Extract<GameEvent, { type: 'rankUp' }>): {
  title: string;
  body: string | null;
  /** The skill's icon; Total has none of its own. */
  skill: string | null;
  href: string;
} {
  const place = fmt.ordinal(e.place);
  const total = e.skill === 'total';
  const band = BAND[e.band] as string | undefined;
  return {
    title: total ? t('moment.rankUpTotal', { place }) : t('moment.rankUp', { place, ladder: t(`skill.${e.skill}`) }),
    body: band ? t(band) : null,
    skill: total ? null : e.skill,
    href: total ? '/hiscores' : `/hiscores?skill=${e.skill}`,
  };
}
