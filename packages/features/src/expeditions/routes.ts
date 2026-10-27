// Expeditions' routes: setting out on the route shown (choosing its road at the fork), giving up a run,
// and buying a relic's next rank with marks. Pure: each takes the state and returns a new one, an
// answer and the events to announce. Setting out only lays the route down; the page then starts the
// run in the Combat lane, as it starts any action.
import type { GameEvent, State } from '@idle-clash/kernel';
import type { Region } from '../shared/expeditions/data.ts';
import { RELIC_COSTS, relicById, rankOf } from '../shared/expeditions/relics.ts';
import { expeditionsOf, setExpeditions } from '../shared/expeditions/state.ts';
import { nextRoute, type Hours } from './route.ts';

type Answer<R> = { state: State; result: R; events: GameEvent[] };
const no = <R>(state: State, result: R): Answer<R> => ({ state, result, events: [] });

export type SetOutResult = { ok: true } | { ok: false; reason: 'underway' | 'noFoes' | 'noRoad' };

/** Lays down the shown route with the road chosen; the next route shown will be a new one. */
export function setOut(state: State, region: Region, hours: Hours, road: string): Answer<SetOutResult> {
  const e = expeditionsOf(state);
  if (e.run && e.run.at > 0) return no(state, { ok: false, reason: 'underway' });
  const route = nextRoute(state, region, hours);
  if (!route) return no(state, { ok: false, reason: 'noFoes' });
  if (!route.roads.includes(road)) return no(state, { ok: false, reason: 'noRoad' });
  const out = structuredClone(state);
  const twists = [...new Set([...e.twists, ...route.twists])];
  setExpeditions(out, {
    ...e,
    drawn: e.drawn + 1,
    twists,
    run: { ...route, seq: e.drawn, road, at: 0, marks: 0, cleared: 0, finds: [] },
  });
  return { state: out, result: { ok: true }, events: [] };
}

/** Gives up the run: what it brought is kept; the route is gone. */
export function abandon(state: State): Answer<{ ok: true }> {
  const e = expeditionsOf(state);
  if (!e.run) return no(state, { ok: true });
  const out = structuredClone(state);
  setExpeditions(out, { ...e, run: null });
  return { state: out, result: { ok: true }, events: [] };
}

export type RelicResult = { ok: true } | { ok: false; reason: 'unknown' | 'full' | 'marks' };

/** Buys a relic's next rank. */
export function buyRelic(state: State, id: string): Answer<RelicResult> {
  const relic = relicById(id);
  if (!relic) return no(state, { ok: false, reason: 'unknown' });
  const rank = rankOf(state, id);
  if (rank >= relic.ranks) return no(state, { ok: false, reason: 'full' });
  const cost = RELIC_COSTS[rank];
  const e = expeditionsOf(state);
  if (e.marks < cost) return no(state, { ok: false, reason: 'marks' });
  const out = structuredClone(state);
  setExpeditions(out, { ...e, marks: e.marks - cost, relics: { ...e.relics, [id]: rank + 1 } });
  return { state: out, result: { ok: true }, events: [] };
}
