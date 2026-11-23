// The realm's work said (session 218): a gift in its toast, and a stage raised in its banner, the tray and the
// away recap alike ("The beacon on the hill: stage 2 of 5 raised"; the fifth, "The beacon on the hill stands").
import { fmt, t } from '@idle-clash/content';
import type { EventOf } from '@idle-clash/kernel';

/** A work's name, from its literal key (every string is used where its key is written). */
const NAMES: Record<string, string> = {
  beacon: 'realmWork.beacon',
  bridge: 'realmWork.bridge',
  'great-hall': 'realmWork.great-hall',
};
export const realmWorkName = (work: string): string => t(NAMES[work] ?? 'realmWork.title');

export function realmWorkWords(e: EventOf<'realmGiven'> | EventOf<'realmWorkStage'>): { title: string; body: string } {
  const work = realmWorkName(e.work);
  if (e.type === 'realmGiven')
    return { title: t('realmWork.gave', { work }), body: t('realmWork.gaveBody', { gold: fmt.int(e.worth) }) };
  return e.stage >= 5
    ? { title: t('realmWork.stands', { work }), body: t('realmWork.standsBody') }
    : { title: t('realmWork.raised', { work, stage: fmt.int(e.stage) }), body: t('realmWork.raisedBody') };
}
