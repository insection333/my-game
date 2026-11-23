// The realm's work on the Hearth (session 218): a tile beside the steading's works, and its sheet
// (`?panel=realm-work`): the work, its stage of five, what the realm has given against what it asks, how many
// have given and your own part (no ladder of who gave most), when the season ends, the thanks for the last
// work raised with your part, and what you can give: gold in a few amounts, or all of a material held.
import { fmt, t } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { itemOf } from '../shared/catalog.ts';
import { nice } from '../shared/pace.ts';
import { REALM_WORK, realmWorkOf, workStage, type RealmWorkId } from '../shared/realm-work.ts';
import { seasonAt } from '../shared/season.ts';
import { givable } from './realm-give.ts';
import { realmWorkName } from '../shared/realm-work-words.ts';

export interface RealmWorkView {
  work: RealmWorkId;
  name: string;
  stage: number;
  stages: number;
  /** "Stage 2 of 5", or "Finished". */
  standing: string;
  /** "12.4M of 40M given by 4" */
  given: string;
  /** "Your part: 2.1M", or null before any. */
  mine: string | null;
  /** "The season ends 28 Dec, 11:00" */
  ends: string;
  finished: boolean;
  /** "The beacon on the hill stands, raised by Keeper, Elder and 3 more", or null. */
  thanks: string | null;
  gold: { amount: number; label: string }[];
  materials: { item: string; label: string; worth: string }[];
}

const nameOf = (work: RealmWorkId) => realmWorkName(work);
/** Gold to give: a hundredth, a tenth and half the purse, in round sums. */
const AMOUNTS = [0.01, 0.1, 0.5];
const MATERIALS = 6;

export function realmWorkView(state: State, now: number): RealmWorkView | null {
  const season = seasonAt(now);
  const m = realmWorkOf(state);
  if (!season || !m || m.season !== season.number) return null;
  const stage = workStage(m);
  const finished = m.given >= m.needed;
  const purse = countOf(state, 'gold');
  const gold = [...new Set(AMOUNTS.map((a) => nice(purse * a)))]
    .filter((g) => g >= 1000 && g <= purse)
    .map((amount) => ({ amount, label: t('realmWork.giveGold', { gold: fmt.short(amount) }) }));
  const materials = Object.keys(state.items)
    .filter((id) => givable(id) && countOf(state, id) > 0)
    .map((id) => ({ id, count: countOf(state, id), worth: itemOf(id)!.value * countOf(state, id) }))
    .sort((a, b) => b.worth - a.worth)
    .slice(0, MATERIALS)
    .map((x) => ({
      item: x.id,
      label: t('realmWork.material', { item: t(`item.${x.id}`), count: fmt.int(x.count) }),
      worth: t('realmWork.worth', { gold: fmt.short(x.worth) }),
    }));
  const th = m.thanks;
  return {
    work: m.work,
    name: nameOf(m.work),
    stage,
    stages: REALM_WORK.STAGES,
    standing: finished
      ? t('realmWork.finished')
      : t('realmWork.stage', { stage: fmt.int(stage), of: fmt.int(REALM_WORK.STAGES) }),
    given:
      m.givers === 1
        ? t('realmWork.givenOne', { given: fmt.short(m.given), needed: fmt.short(m.needed) })
        : t('realmWork.given', { given: fmt.short(m.given), needed: fmt.short(m.needed), givers: fmt.int(m.givers) }),
    mine: m.mine > 0 ? t('realmWork.mine', { gold: fmt.short(m.mine) }) : null,
    ends: t('realmWork.ends', { when: fmt.when(season.end, now) }),
    finished,
    thanks: th
      ? th.more > 0
        ? t('realmWork.thanksMore', { work: nameOf(th.work), names: th.names.join(', '), more: fmt.int(th.more) })
        : t('realmWork.thanks', {
            work: nameOf(th.work),
            names:
              th.names.length === 1
                ? th.names[0]
                : t('list.and', { first: th.names.slice(0, -1).join(', '), last: th.names.at(-1)! }),
          })
      : null,
    gold: finished ? [] : gold,
    materials: finished ? [] : materials,
  };
}
