// The Deep as a player goes down it (session 215): from Hitpoints 99, a descent at the start of the day's
// first visit while the Combat lane fights a foe, the foe queued to follow once it ends; and the Deep's relics
// raised with the marks, cheapest rank first, before the quartermaster takes what is left.
import { FEATURES } from '@idle-clash/features';
import type { Command, State } from '@idle-clash/kernel';
import { DEEP } from '../../../packages/features/src/shared/expeditions/deep.ts';
import { DEEP_RELICS, deepRank, deepRelicCost } from '../../../packages/features/src/shared/expeditions/deep-relics.ts';
import { expeditionsOf } from '../../../packages/features/src/shared/expeditions/state.ts';
import { level } from './world.ts';

const route = (state: State, r: string, input: unknown, now: number) =>
  FEATURES.find((f) => f.id === 'expeditions')!.routes[r].run(state, input, now);

/** A descent begun, and the commands that start it and queue the foe after it; or nothing. */
export function descent(state: State, now: number): { state: State; commands: Command[] } {
  const current = state.lanes.combat.current?.action;
  const deep = expeditionsOf(state).deep;
  if (level(state, 'hitpoints') < DEEP.OPENS || deep?.run || current?.feature !== 'combat' || state.lanes.combat.next)
    return { state, commands: [] };
  const begun = route(state, 'descend', {}, now);
  if (!(begun.result as { ok: boolean }).ok) return { state, commands: [] };
  return {
    state: begun.state,
    commands: [
      { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: 'deep' } },
      // One Next, as a lane held before session 240.
      { type: 'clearNext', lane: 'combat' },
      { type: 'queueNext', lane: 'combat', action: { feature: current.feature, id: current.id } },
    ],
  };
}

/** The Deep's relics raised with the marks held, the cheapest rank first. */
export function raiseDeepRelics(state: State, now: number): { state: State; bought: number } {
  if (level(state, 'hitpoints') < DEEP.OPENS) return { state, bought: 0 };
  let s = state;
  let bought = 0;
  for (;;) {
    const id = [...DEEP_RELICS].sort((a, b) => deepRank(s, a) - deepRank(s, b))[0];
    if (expeditionsOf(s).marks < deepRelicCost(deepRank(s, id))) return { state: s, bought };
    const r = route(s, 'deepRelic', { relic: id }, now);
    if (!(r.result as { ok: boolean }).ok) return { state: s, bought };
    s = r.state;
    bought++;
  }
}
