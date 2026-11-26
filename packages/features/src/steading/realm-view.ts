// The realm's work on the Hearth (session 218): a tile beside the steading's works, and its sheet
// (`?panel=realm-work`): the work, its stage of five, what the realm has given against what it asks, how many
// have given and your own part (no ladder of who gave most), when the season ends, the thanks for the last
// work raised with your part, and what you can give: gold in a few amounts, or all of a material held.
import { fmt, t } from '@idle-clash/content';
import { countOf, type State } from '@idle-clash/kernel';
import { itemOf } from '../shared/catalog.ts';
import { nice } from '../shared/pace.ts';
import { pedlarKeeps } from '../shared/pedlar-lots.ts';
import { REALM_WORK, realmWorkOf, workStage, type RealmWorkId } from '../shared/realm-work.ts';
import { seasonAt } from '../shared/season.ts';
import { STAGES, stageCost, stageOf, WORKS } from '../shared/steading.ts';
import { isLocked } from '../shared/storehouse.ts';
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
  materials: {
    item: string;
    label: string;
    worth: string;
    /** What is kept back for the pedlar's lot of the day (session 226), or null. */
    kept: string | null;
    /** The steading's next stage that takes it (session 226), said before it is given away, or null. */
    steading: string | null;
  }[];
}

const nameOf = (work: RealmWorkId) => realmWorkName(work);
/** Gold to give: a hundredth, a tenth and half the purse, in round sums. */
const AMOUNTS = [0.01, 0.1, 0.5];
const MATERIALS = 6;

/** A work of the player's own steading whose next stage takes this material, in a sentence, or null. */
function steadingWants(state: State, item: string): string | null {
  for (const w of WORKS) {
    const stage = stageOf(state, w.id);
    if (stage >= STAGES) continue;
    const need = stageCost(w, stage + 1).items.find((x) => x.item === item);
    if (need) return t('realmWork.steadingTakes', { work: t(`work.${w.id}`), count: fmt.int(need.count) });
  }
  return null;
}

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
    .map((id) => ({ id, kept: givable(id) ? pedlarKeeps(state, now, id) : 0 }))
    .map(({ id, kept }) => ({ id, kept, count: givable(id) && !isLocked(state, id) ? countOf(state, id) - kept : 0 }))
    .filter((x) => x.count > 0)
    .map((x) => ({ ...x, worth: itemOf(x.id)!.value * x.count }))
    .sort((a, b) => b.worth - a.worth)
    .slice(0, MATERIALS)
    .map((x) => ({
      item: x.id,
      label: t('realmWork.material', { item: t(`item.${x.id}`), count: fmt.int(x.count) }),
      worth: t('realmWork.worth', { gold: fmt.short(x.worth) }),
      kept: x.kept > 0 ? t('realmWork.pedlarKept', { count: fmt.int(x.kept) }) : null,
      steading: steadingWants(state, x.id),
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
