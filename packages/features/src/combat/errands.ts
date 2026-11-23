// The bounty board's errands on the Hearth (session 188): a bounty done waits to be claimed; with none
// held, the day's bounties on offer. A bounty under way asks for nothing: the lane is doing it.
import { fmt, midSentence, t } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import { ERRAND_ORDER, type ErrandRow } from '../shared/errand.ts';
import { bountyView } from './bounty.ts';

export function bountyErrands(state: State, now: number): ErrandRow[] {
  const v = bountyView(state, now);
  if (!v) return [];
  if (v.held?.done)
    return [
      {
        icon: v.held.foe,
        text: t('errand.bountyDone', { foe: midSentence(v.held.name) }),
        href: '/combat',
        order: ERRAND_ORDER.bountyDone,
      },
    ];
  if (v.held || !v.offers.length) return [];
  return [
    {
      icon: v.offers[0].foe,
      text: v.offers.length === 1 ? t('errand.bountiesOne') : t('errand.bounties', { count: fmt.int(v.offers.length) }),
      href: '/combat',
      order: ERRAND_ORDER.bounties,
    },
  ];
}
