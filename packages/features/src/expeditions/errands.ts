// The Expeditions' errands on the Hearth (session 188): a share of the realm's fallen boss to take, the
// realm's strike while it waits today and the week's boss stands, and the bosses that can be fought today
// (those the player fares well against), and the Deep while it has no depth this week (session 214), each
// leading to the Expeditions tab where it is done.
import { fmt, midSentence, t } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import { ERRAND_ORDER, inHand, type ErrandRow } from '../shared/errand.ts';
import { realmBossIn, realmOf } from '../shared/realm.ts';
import { realmName } from '../shared/realm-words.ts';
import { realmView } from './realm.ts';
import { bossRows } from './views.ts';
import { deepOf } from './deep.ts';
import { DEEP } from '../shared/expeditions/deep.ts';
import { HITPOINTS } from '../shared/combat/data.ts';
import { skillLevel } from '../shared/skill.ts';
import { weekOf } from '../shared/week-time.ts';

const HREF = '/combat/expeditions';

export function expeditionErrands(state: State, now: number): ErrandRow[] {
  const rows: ErrandRow[] = [];
  const r = realmOf(state);
  const realm = realmView(state, now);
  if (r && realm) {
    if (realm.share && r.owed)
      rows.push({
        icon: r.owed.boss,
        text: t('errand.share', { name: realmName(r.owed.boss) }),
        href: HREF,
        order: ERRAND_ORDER.share,
      });
    if (realm.ready && !r.fell && !inHand(state.lanes, 'expeditions', 'realm'))
      rows.push({
        icon: realmBossIn(r.week).id,
        text: t('errand.realm', { name: midSentence(realm.name) }),
        href: HREF,
        order: ERRAND_ORDER.realm,
      });
  }
  const bosses = bossRows(state, now).filter(
    (b) => b.ready && (b.verdictId === 'easy' || b.verdictId === 'fair') && !inHand(state.lanes, 'expeditions', b.id),
  );
  if (bosses.length)
    rows.push({
      icon: bosses[0].id,
      text:
        bosses.length === 1
          ? t('errand.bossesOne', { name: bosses[0].name })
          : t('errand.bosses', { count: fmt.int(bosses.length) }),
      href: HREF,
      order: ERRAND_ORDER.bosses,
    });
  // The Deep (session 214): no depth yet this week, so no place on its ladder.
  const deep = deepOf(state);
  if (skillLevel(state, HITPOINTS) >= DEEP.OPENS && !deep.run && deep.week !== weekOf(now))
    rows.push({ icon: 'peaks', text: t('errand.deep'), href: HREF, order: ERRAND_ORDER.deep });
  return rows;
}
