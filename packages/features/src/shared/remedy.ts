// What puts a stopped lane right, wherever the page says it stopped (the lanes rail, the away recap):
// one table, so the two never offer different things for the same stop.
import { midSentence, t } from '@idle-clash/content';
import type { ActionRef } from '@idle-clash/kernel';

export interface Remedy {
  label: string;
  /** An item whose panel says where it comes from. */
  item?: string;
  /** Otherwise, the page to go to. */
  path?: string;
}

export function remedyFor(
  reason: { code: string; detail?: Record<string, string | number> },
  action: ActionRef | null,
): Remedy | null {
  const item = reason.detail?.item;
  switch (reason.code) {
    case 'outOfInputs':
    case 'needsKey':
      return typeof item === 'string'
        ? { label: t('lane.fix.item', { item: midSentence(t(`item.${item}`)) }), item }
        : null;
    case 'retreated':
    case 'tooHurt':
      return { label: t('lane.fix.food'), path: '/combat' };
    case 'noWeapon':
      return { label: t('lane.fix.weapon'), path: '/combat' };
    case 'storehouseFull':
      return { label: t('lane.fix.space'), path: '/storehouse' };
    case 'hitpointsTooLow':
      return { label: t('lane.fix.train', { skill: t('skill.hitpoints') }), path: '/skills/hitpoints' };
    case 'levelTooLow':
      // A skill's own action: its page, where the level is earned.
      return action && action.feature !== 'combat'
        ? { label: t('lane.fix.train', { skill: t(`skill.${action.feature}`) }), path: `/skills/${action.feature}` }
        : null;
    default:
      return null;
  }
}
