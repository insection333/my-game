// Why a player is not on the ladder shown (session 128): a skill ladder ranks them after their first level,
// the Castles ladder once their castle is raised, where it said "after your first level" there too.
import { t } from '@idle-clash/content';

export const unrankedNote = (skill: string): string =>
  skill === 'castle' ? t('hiscores.unrankedCastle') : t('hiscores.unranked');
