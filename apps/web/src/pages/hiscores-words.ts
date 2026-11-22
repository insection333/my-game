// Why a player is not on the ladder shown (session 128): a skill ladder ranks them after their first level,
// the Castles ladder once their castle is raised, this season's with their first goal done in it (session 165), where it said "after your first level" there too.
import { t } from '@idle-clash/content';

export const unrankedNote = (skill: string): string =>
  skill === 'castle'
    ? t('hiscores.unrankedCastle')
    : skill === 'season'
      ? t('hiscores.unrankedSeason')
      : skill === 'realm'
        ? t('hiscores.unrankedRealm')
        : t('hiscores.unranked');
