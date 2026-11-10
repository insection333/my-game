// What a sale would take from the lanes (session 71), said before selling all but one: the running lane an
// item feeds (it stops when they run out), the food a fight eats, or the supply a style fights with.
import { fmt, t } from '@idle-clash/content';
import { LANE_IDS, type State } from '@idle-clash/kernel';
import { skillActions } from './catalog.ts';
import { mealsOf, styleOf, supplyOf } from './combat/state.ts';

/** How a running lane uses this item, in a sentence, or null when none does. */
export function laneUsing(state: State, item: string): string | null {
  for (const lane of LANE_IDS) {
    const run = state.lanes[lane].current;
    if (!run) continue;
    const skill = skillActions().find((s) => s.feature === run.action.feature);
    const action = skill?.actions.find((a) => a.id === run.action.id);
    if (skill && action?.takes?.some((g) => g.item === item))
      return t('store.inUse.lane', { skill: t(`skill.${skill.skill}`) });
  }
  if (!state.lanes.combat.current) return null;
  if (mealsOf(state).some((m) => m.item === item)) return t('store.inUse.food');
  const style = styleOf(state);
  const supply = style ? supplyOf(state, style) : null;
  return supply?.item === item ? t('store.inUse.supply', { pct: fmt.pct(supply.pct) }) : null;
}
