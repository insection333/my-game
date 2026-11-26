// Forging an heirloom at the forge (session 251; its rules in shared/heirlooms.ts): from Smithing 90, ten of
// a boss's Rare find and its Legendary find make its heirloom, one held at a time.
import { countOf, give, take, type GameEvent, type State } from '@idle-clash/kernel';
import { heirloomCost, heirloomOf, HEIRLOOM } from '../shared/heirlooms.ts';
import { skillLevel } from '../shared/skill.ts';

type Answer<R> = { state: State; result: R; events: GameEvent[] };
export type ForgeResult = { ok: true } | { ok: false; reason: 'unknown' | 'locked' | 'held' | 'short' };

export function forgeHeirloom(state: State, item: string, now: number = state.clock): Answer<ForgeResult> {
  const no = (reason: Exclude<ForgeResult, { ok: true }>['reason']): Answer<ForgeResult> => ({
    state,
    result: { ok: false, reason },
    events: [],
  });
  const h = heirloomOf(item);
  if (!h) return no('unknown');
  if (skillLevel(state, 'smithing') < HEIRLOOM.OPENS) return no('locked');
  if (countOf(state, item) > 0) return no('held');
  const cost = heirloomCost(h);
  if (cost.some((c) => countOf(state, c.item) < c.count)) return no('short');
  const out = structuredClone(state);
  for (const c of cost) take(out, c.item, c.count);
  give(out, item, 1);
  return { state: out, result: { ok: true }, events: [{ type: 'heirloomForged', at: now, item }] };
}
