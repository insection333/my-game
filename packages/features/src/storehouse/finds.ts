// Using a Rare find (GAME_DESIGN.md section 8): instead of selling it, the player spends it on one
// action of its skill, which gains 500 mastery completions at once. A Woodcutting find goes to a tree,
// a Smithing find to a recipe; a combat style's find goes to a foe, since foes are what styles train on,
// and a boss's to a foe of its region.
import { MASTERY_STEPS, masteryStep } from '@idle-clash/content';
import { countOf, noteMoment, take, type ActionRef, type GameEvent, type State } from '@idle-clash/kernel';
import { findOf, RARE_FIND_COMPLETIONS, skillActions } from '../shared/catalog.ts';
import { FOES, HITPOINTS, regionOf, STYLE_SKILLS } from '../shared/combat/data.ts';
import { BOSSES } from '../shared/expeditions/data.ts';
import { perksAt, skillLevel } from '../shared/skill.ts';

export { RARE_FIND_COMPLETIONS };

export type UseFindResult =
  { ok: true } | { ok: false; reason: { code: 'notARareFind' | 'notOwned' | 'notItsAction' } };

/** The actions a find may be used on: its skill's actions the player has open. */
export function actionsFor(state: State, item: string): ActionRef[] {
  const f = findOf(item);
  if (!f) return [];
  if ((STYLE_SKILLS as readonly string[]).includes(f.skill))
    return FOES.filter((x) => x.hitpoints <= skillLevel(state, HITPOINTS)).map((x) => ({
      feature: 'combat',
      id: x.id,
    }));
  // A boss's find goes to a foe of the boss's region.
  const boss = BOSSES.find((b) => b.finds.rare === item || b.finds.legendary === item);
  if (boss)
    return FOES.filter((x) => regionOf(x.tier) === boss.region && x.hitpoints <= skillLevel(state, HITPOINTS)).map(
      (x) => ({ feature: 'combat', id: x.id }),
    );
  const own = skillActions().find((s) => s.skill === f.skill);
  const level = skillLevel(state, f.skill);
  return (own?.actions ?? []).filter((a) => a.level <= level).map((a) => ({ feature: own!.feature, id: a.id }));
}

export function useFind(
  state: State,
  item: string,
  action: ActionRef,
  now: number,
  count = 1,
): { state: State; result: UseFindResult; events: GameEvent[] } {
  const f = findOf(item);
  const refuse = (code: 'notARareFind' | 'notOwned' | 'notItsAction') => ({
    state,
    result: { ok: false as const, reason: { code } },
    events: [],
  });
  if (!f || f.rarity !== 'rare') return refuse('notARareFind');
  if (countOf(state, item) < count) return refuse('notOwned');
  if (!actionsFor(state, item).some((a) => a.feature === action.feature && a.id === action.id))
    return refuse('notItsAction');
  const next = structuredClone(state);
  take(next, item, count);
  const key = `${action.feature}:${action.id}`;
  const before = Object.hasOwn(next.mastery, key) ? next.mastery[key] : 0;
  const completions = count * RARE_FIND_COMPLETIONS;
  next.mastery[key] = before + completions;
  const gain = perksAt(f.ladder, skillLevel(state, f.skill)).masteryGain;
  const [was, now_] = [masteryStep(before, gain), masteryStep(before + completions, gain)];
  // The press answered first (session 93), then any mastery steps it brought.
  const events: GameEvent[] = [
    count > 1
      ? { type: 'findUsed', at: now, item, action, completions, count }
      : { type: 'findUsed', at: now, item, action, completions },
  ];
  for (let step = was + 1; step <= now_; step++) events.push({ type: 'masteryStep', at: now, action, step });
  noteMoment(next, now);
  return { state: next, result: { ok: true }, events };
}

/** An action a Rare find may go to, with its completions and how many finds bring its next mastery step. */
export interface FindUse {
  action: ActionRef;
  completions: number;
  /** The finds that reach the next step, and the step they bring (it may jump more than one). */
  next: { count: number; step: number };
}

/** The actions a held Rare find still helps, most used first, then the latest opened: one at full mastery gains nothing from it
 *  (session 154: the list led with a pine whose mastery was full, the newcomer's 200 acorns one press each). */
export function findUses(state: State, item: string): FindUse[] {
  const f = findOf(item);
  if (!f) return [];
  const gain = perksAt(f.ladder, skillLevel(state, f.skill)).masteryGain;
  const full = MASTERY_STEPS.length;
  const rows: FindUse[] = [];
  for (const action of actionsFor(state, item)) {
    const key = `${action.feature}:${action.id}`;
    const completions = Object.hasOwn(state.mastery, key) ? state.mastery[key] : 0;
    const step = masteryStep(completions, gain);
    if (step >= full) continue;
    let count = 1;
    while (masteryStep(completions + count * RARE_FIND_COMPLETIONS, gain) <= step) count++;
    rows.push({
      action,
      completions,
      next: { count, step: masteryStep(completions + count * RARE_FIND_COMPLETIONS, gain) },
    });
  }
  // Most used first; among the unused, the latest opened (the highest tier) first, where the oldest led.
  const order = new Map(rows.map((r, i) => [r, i]));
  return rows.sort((a, b) => b.completions - a.completions || order.get(b)! - order.get(a)!);
}
