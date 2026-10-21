// Using a Rare find (GAME_DESIGN.md section 8): instead of selling it, the player spends it on one
// action of its skill, which gains 500 mastery completions at once. A Woodcutting find goes to a tree,
// a Smithing find to a recipe; a combat style's find goes to a foe, since foes are what styles train on.
import { masteryStep } from '@idle-clash/content';
import { countOf, noteMoment, take, type ActionRef, type GameEvent, type State } from '@idle-clash/kernel';
import { findOf, skillActions } from '../shared/catalog.ts';
import { FOES, HITPOINTS, STYLE_SKILLS } from '../shared/combat/data.ts';
import { perksAt, skillLevel } from '../shared/skill.ts';

export const RARE_FIND_COMPLETIONS = 500;

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
  const own = skillActions().find((s) => s.skill === f.skill);
  const level = skillLevel(state, f.skill);
  return (own?.actions ?? []).filter((a) => a.level <= level).map((a) => ({ feature: own!.feature, id: a.id }));
}

export function useFind(
  state: State,
  item: string,
  action: ActionRef,
  now: number,
): { state: State; result: UseFindResult; events: GameEvent[] } {
  const f = findOf(item);
  const refuse = (code: 'notARareFind' | 'notOwned' | 'notItsAction') => ({
    state,
    result: { ok: false as const, reason: { code } },
    events: [],
  });
  if (!f || f.rarity !== 'rare') return refuse('notARareFind');
  if (countOf(state, item) < 1) return refuse('notOwned');
  if (!actionsFor(state, item).some((a) => a.feature === action.feature && a.id === action.id))
    return refuse('notItsAction');
  const next = structuredClone(state);
  take(next, item, 1);
  const key = `${action.feature}:${action.id}`;
  const before = Object.hasOwn(next.mastery, key) ? next.mastery[key] : 0;
  next.mastery[key] = before + RARE_FIND_COMPLETIONS;
  const gain = perksAt(f.ladder, skillLevel(state, f.skill)).masteryGain;
  const [was, now_] = [masteryStep(before, gain), masteryStep(before + RARE_FIND_COMPLETIONS, gain)];
  const events: GameEvent[] = [];
  for (let step = was + 1; step <= now_; step++) events.push({ type: 'masteryStep', at: now, action, step });
  if (events.length) noteMoment(next, now);
  return { state: next, result: { ok: true }, events };
}
