// The steading's one route: raising a work a stage, paid in gold and the player's own materials. Every
// cost is checked before anything is taken, so a refusal changes nothing.
import { countOf, take, type GameEvent, type State } from '@idle-clash/kernel';
import { STAGES, stageCost, stageOf, steadingOf, workById } from '../shared/steading.ts';

export type RaiseResult =
  { ok: true; stage: number } | { ok: false; reason: 'unknown' | 'top' | 'short'; item?: string };
type Answer = { state: State; result: RaiseResult; events: GameEvent[] };

export function raise(state: State, id: string): Answer {
  const no = (reason: 'unknown' | 'top' | 'short', item?: string): Answer => ({
    state,
    result: { ok: false, reason, ...(item ? { item } : {}) },
    events: [],
  });
  const work = workById(id);
  if (!work) return no('unknown');
  const stage = stageOf(state, id) + 1;
  if (stage > STAGES) return no('top');
  const cost = stageCost(work, stage);
  if (countOf(state, 'gold') < cost.gold) return no('short', 'gold');
  const missing = cost.items.find((i) => countOf(state, i.item) < i.count);
  if (missing) return no('short', missing.item);
  const out = structuredClone(state);
  take(out, 'gold', cost.gold);
  for (const i of cost.items) take(out, i.item, i.count);
  out.features.steading = { stages: { ...steadingOf(state).stages, [id]: stage } };
  return { state: out, result: { ok: true, stage }, events: [] };
}
