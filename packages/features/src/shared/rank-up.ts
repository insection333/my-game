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
  // A season's ladder (session 165), kept as `season:N`: named by its number, as notices outlive it.
  const season = /^season:(\d+)$/.exec(e.skill);
  // The Deep's ladder of the week (session 214), kept as `deep:<Monday>`.
  if (e.skill.startsWith('deep:'))
    return {
      title: t('moment.rankUpDeep', { place }),
      body: band ? t(band) : null,
      skill: 'peaks',
      href: '/hiscores?skill=deep',
    };
  if (season)
    return {
      title: t('moment.rankUpSeason', { place, number: fmt.int(Number(season[1])) }),
      body: band ? t(band) : null,
      skill: null,
      href: '/hiscores?skill=season',
    };
  return {
    title: total ? t('moment.rankUpTotal', { place }) : t('moment.rankUp', { place, ladder: t(`skill.${e.skill}`) }),
    body: band ? t(band) : null,
    skill: total ? null : e.skill,
    href: total ? '/hiscores' : `/hiscores?skill=${e.skill}`,
  };
}
