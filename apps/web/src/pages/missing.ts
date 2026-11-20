// What a sheet says when what its address names is not there (session 159): a player not found is said
// only when the server says so (a card asked for offline said "There is no player of that name." of a
// player who exists), and a deed or a steading work named by no address says so where its sheet stood empty.
import { t } from '@idle-clash/content';
import { refused } from '../refused.ts';

/** Why a profile card did not come. */
export const cardRefusal = (err: unknown): string =>
  refused(err, { notFound: t('profile.none'), invalidInput: t('profile.none') });

/** A deed's or a work's sheet whose address names none. */
export const missingWords = (what: 'deed' | 'work'): string =>
  t(what === 'deed' ? 'deeds.missing' : 'steading.missing');
