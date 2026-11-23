// The realm's boss's events in words (session 174), as the moments and the notices tray say them.
import { dayTurns, fmt, t } from '@idle-clash/content';
import type { GameEvent } from '@idle-clash/kernel';

type RealmEvent = Extract<GameEvent, { type: 'realmFought' | 'realmFell' | 'realmShare' }>;

/** The realm's boss by name: "The realm's Ember Wyrm" (session 181: it read "The realm's The Ember Wyrm"). */
export const realmName = (boss: string): string => t('realm.name', { boss: t(`boss.${boss}`).replace(/^The\s+/, '') });
const nameOf = realmName;

export function realmWords(e: RealmEvent): { title: string; body: string | null } {
  switch (e.type) {
    case 'realmFought':
      return e.won
        ? {
            title: t('realm.struck', { name: nameOf(e.boss) }),
            body:
              e.marks === 1
                ? t('realm.struckPaysOne', { gold: fmt.int(e.gold) })
                : t('realm.struckPays', { gold: fmt.int(e.gold), marks: fmt.int(e.marks) }),
          }
        : { title: t('realm.held', { name: nameOf(e.boss) }), body: t('realm.heldBody', { back: dayTurns(e.at) }) };
    case 'realmFell':
      return {
        title: t('realm.fallen', { name: nameOf(e.boss) }),
        body: e.strikes === 1 ? t('realm.fallenBodyOne') : t('realm.fallenBody', { strikes: fmt.int(e.strikes) }),
      };
    case 'realmShare':
      return {
        title: t('realm.share', { name: nameOf(e.boss) }),
        body:
          e.marks === 1
            ? t('realm.sharePaysOne', { gold: fmt.int(e.gold) })
            : t('realm.sharePays', { gold: fmt.int(e.gold), marks: fmt.int(e.marks) }),
      };
  }
}
