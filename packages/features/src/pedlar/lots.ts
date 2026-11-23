// The pedlar's three lots of the day (session 217, the plan *Dead and short content, 23 November*): an
// Uncommon find the player has found, a material of a gathering skill they have gathered and passed by twenty
// levels, and a dish they have cooked. Drawn only from what the player has or makes, so a lot is never a chore to fetch;
// each pick is the candidate with the least of the day's draws (rendezvous hashing), so a level gained in the
// day adds a candidate without reshuffling the others.
import { seeded, type State } from '@idle-clash/kernel';
import { allFinds, foods, itemOf, skillActions } from '../shared/catalog.ts';
import { FOODS } from '../shared/combat/data.ts';
import { skillLevel } from '../shared/skill.ts';

export type LotKind = 'find' | 'material' | 'dish';
export interface Lot {
  kind: LotKind;
  item: string;
  count: number;
}

const GATHERING = ['woodcutting', 'mining', 'fishing', 'runecraft'];
/** A material is old once the player is this many levels past it. */
const OLDER = 20;

/** Whether the player has done an action: its mastery counts every completion. */
const done = (state: State, feature: string, id: string) => (state.mastery[`${feature}:${id}`] ?? 0) > 0;

const dayNumber = (day: string) => Math.round(Date.parse(`${day}T00:00:00Z`) / 86_400_000);

function pick(state: State, day: string, kind: LotKind, candidates: string[]): string | null {
  const r = seeded(state.seed);
  let best: string | null = null;
  let least = Infinity;
  for (const id of candidates) {
    let h = 0;
    for (const c of `${kind}:${id}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const x = r('pedlar', dayNumber(day) * 997 + (h % 100_003));
    if (x < least) [least, best] = [x, id];
  }
  return best;
}

/** A material's count: more of a later tier's (its action's level), in round fifties. */
const materialCount = (level: number) => Math.max(100, Math.round((100 + level * 3) / 50) * 50);

export function lotsOf(state: State, day: string): Lot[] {
  const lots: Lot[] = [];
  const found = allFinds()
    .filter((f) => f.rarity === 'uncommon' && Object.hasOwn(state.found, f.item))
    .map((f) => f.item);
  const find = pick(state, day, 'find', found);
  if (find) lots.push({ kind: 'find', item: find, count: 3 });
  const old = skillActions()
    .filter((s) => GATHERING.includes(s.skill))
    .flatMap((s) =>
      s.actions
        .filter((a) => a.level + OLDER <= skillLevel(state, s.skill) && done(state, s.feature, a.id) && a.gives?.[0])
        .map((a) => ({ item: a.gives![0].item, level: a.level })),
    )
    .filter((m, i, all) => all.findIndex((x) => x.item === m.item) === i && itemOf(m.item)?.kind === 'resource');
  const material = pick(
    state,
    day,
    'material',
    old.map((m) => m.item),
  );
  if (material)
    lots.push({ kind: 'material', item: material, count: materialCount(old.find((m) => m.item === material)!.level) });
  const vendor = new Set(FOODS.map((f) => f.id));
  const cooks = skillActions().find((s) => s.skill === 'cooking');
  const dishes = (cooks?.actions ?? [])
    .filter((a) => a.level <= skillLevel(state, 'cooking') && done(state, cooks!.feature, a.id))
    .map((a) => a.gives?.[0]?.item)
    .filter((id): id is string => !!id && !vendor.has(id) && foods().some((f) => f.id === id));
  const dish = pick(state, day, 'dish', dishes);
  if (dish) lots.push({ kind: 'dish', item: dish, count: 10 });
  return lots;
}
