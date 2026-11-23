// Tempering at the forge (session 216; its numbers in shared/temper.ts): a worn piece tempered a step with its
// tier's bars and trophies (the trophies held most spent first), from Smithing 90.
import { take, type GameEvent, type State } from '@idle-clash/kernel';
import { countOf } from '@idle-clash/kernel';
import type { GearSlot } from '@idle-clash/content';
import { wornIn } from '../shared/combat/state.ts';
import { skillLevel } from '../shared/skill.ts';
import { stepCost, stepsOf, TEMPER, temperOf } from '../shared/temper.ts';
import { trophiesHeld } from '../shared/temper-view.ts';

type Answer<R> = { state: State; result: R; events: GameEvent[] };
export type TemperResult = { ok: true } | { ok: false; reason: 'locked' | 'notWorn' | 'full' | 'bars' | 'trophies' };
const no = (state: State, reason: Exclude<TemperResult, { ok: true }>['reason']): Answer<TemperResult> => ({
  state,
  result: { ok: false, reason },
  events: [],
});

export function temper(state: State, slot: GearSlot, now: number = state.clock): Answer<TemperResult> {
  if (skillLevel(state, 'smithing') < TEMPER.OPENS) return no(state, 'locked');
  const item = wornIn(state, slot);
  if (!item) return no(state, 'notWorn');
  const steps = stepsOf(state, item);
  if (steps >= TEMPER.STEPS) return no(state, 'full');
  const cost = stepCost(item, steps + 1)!;
  if (countOf(state, cost.bar) < cost.bars) return no(state, 'bars');
  const held = trophiesHeld(state, item);
  if (held.reduce((n, x) => n + x.count, 0) < cost.trophies) return no(state, 'trophies');
  const out = structuredClone(state);
  take(out, cost.bar, cost.bars);
  let left = cost.trophies;
  for (const x of held) {
    const n = Math.min(left, x.count);
    take(out, x.id, n);
    left -= n;
    if (!left) break;
  }
  out.features.smithing = { tempered: { ...temperOf(state).tempered, [item]: steps + 1 } };
  return { state: out, result: { ok: true }, events: [{ type: 'gearTempered', at: now, item, step: steps + 1 }] };
}
