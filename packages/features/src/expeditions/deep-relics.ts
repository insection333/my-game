// The Deep's relics bought and said (session 215; their numbers in shared/expeditions/deep-relics.ts): a rank
// raised with marks, answered as any relic's is, and each relic's row for the Deep's panel.
import { fmt, t } from '@idle-clash/content';
import type { GameEvent, State } from '@idle-clash/kernel';
import {
  DEEP_RELIC,
  DEEP_RELICS,
  deepRank,
  deepRelicCost,
  type DeepRelicId,
} from '../shared/expeditions/deep-relics.ts';
import { DEEP_EMPTY, expeditionsOf, setExpeditions } from '../shared/expeditions/state.ts';

type Answer<R> = { state: State; result: R; events: GameEvent[] };
export type DeepRelicResult = { ok: true } | { ok: false; reason: 'unknown' | 'marks' | 'max' };

const isDeepRelic = (id: string): id is DeepRelicId => (DEEP_RELICS as readonly string[]).includes(id);
/** A rank no one will reach, so a save's numbers stay bounded. */
const MOST = 500;

export function raiseDeepRelic(state: State, id: string, now: number = state.clock): Answer<DeepRelicResult> {
  if (!isDeepRelic(id)) return { state, result: { ok: false, reason: 'unknown' }, events: [] };
  const rank = deepRank(state, id);
  if (rank >= MOST) return { state, result: { ok: false, reason: 'max' }, events: [] };
  const cost = deepRelicCost(rank);
  const e = expeditionsOf(state);
  if (e.marks < cost) return { state, result: { ok: false, reason: 'marks' }, events: [] };
  const out = structuredClone(state);
  const d = e.deep ?? DEEP_EMPTY;
  setExpeditions(out, { ...e, marks: e.marks - cost, deep: { ...d, relics: { ...d.relics, [id]: rank + 1 } } });
  return { state: out, result: { ok: true }, events: [{ type: 'relicRaised', at: now, relic: id, rank: rank + 1 }] };
}

/** What a Deep relic gives at a rank: "8 more meals in a descent's pack". */
export function deepRelicGives(id: DeepRelicId, rank: number): string {
  if (id === 'deep-satchel') return t('deepRelic.gives.satchel', { meals: fmt.int(rank * DEEP_RELIC.MEALS) });
  if (id === 'deep-lantern') {
    const pct = 100 * (1 - (1 - DEEP_RELIC.WARD_PCT / 100) ** rank);
    return t('deepRelic.gives.lantern', { pct: fmt.pct(Math.round(pct * 10) / 10) });
  }
  const pct = 100 * ((1 + DEEP_RELIC.EDGE_PCT / 100) ** rank - 1);
  return t('deepRelic.gives.edge', { pct: fmt.pct(Math.round(pct * 10) / 10) });
}

/** A Deep relic raised, said for its moment: the rank reached and what it now gives. */
export function deepRelicWords(id: string, rank: number): { title: string; body: string; top: boolean } | null {
  if (!isDeepRelic(id)) return null;
  return {
    title: t('deepRelic.raised', { relic: t(`relic.${id}`), rank: fmt.int(rank) }),
    body: t('relic.now', { gives: deepRelicGives(id, rank) }),
    top: false,
  };
}

export interface DeepRelicRow {
  id: DeepRelicId;
  name: string;
  /** "Rank 4", or what one rank gives before the first. */
  rank: string;
  gives: string;
  /** "Next rank: 64 marks" */
  next: string;
  ready: boolean;
}

export function deepRelicRows(state: State): DeepRelicRow[] {
  const marks = expeditionsOf(state).marks;
  return DEEP_RELICS.map((id) => {
    const rank = deepRank(state, id);
    const cost = deepRelicCost(rank);
    return {
      id,
      name: t(`relic.${id}`),
      rank: rank ? t('deepRelic.rank', { rank: fmt.int(rank) }) : t('deepRelic.unraised'),
      gives: rank ? deepRelicGives(id, rank) : t('relic.perRank', { effect: deepRelicGives(id, 1) }),
      next: t('relic.next', { marks: fmt.int(cost) }),
      ready: marks >= cost,
    };
  });
}
