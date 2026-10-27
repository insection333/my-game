// Deeds' routes: recording the deeds done (each with its moment, and the honours it unlocked), and
// choosing which honours to show. Pure: each takes the state and returns a new one, an answer and the
// events to announce.
import { noteMoment, type GameEvent, type State } from '@idle-clash/kernel';
import { POINTS, wordsOf } from './content.ts';
import { HONOURS, honourName, honourOf, unlocked, type HonourKind } from './honours.ts';
import { pending, pointsOf } from './list.ts';
import { deedsOf, setDeeds } from './state.ts';

type Answer<R> = { state: State; result: R; events: GameEvent[] };

/** Records every deed done by now: a moment each, naming any honour it unlocked. */
export function refresh(state: State, now: number): Answer<{ ok: true; done: number }> {
  const found = pending(state, now);
  if (!found.length) return { state, result: { ok: true, done: 0 }, events: [] };
  const before = deedsOf(state);
  const pointsBefore = pointsOf(state);
  const out = structuredClone(state);
  const done = { ...before.done };
  const events: GameEvent[] = [];
  let points = pointsBefore;
  for (const d of found) {
    const had = { ...done };
    const hadPoints = points;
    done[d.id] = now;
    points += POINTS[d.tier];
    const unlocks = HONOURS.filter((h) => !unlocked(h, had, hadPoints) && unlocked(h, done, points)).map(honourName);
    events.push({
      type: 'deedDone',
      at: now,
      deed: d.id,
      name: wordsOf(d, 'name'),
      icon: d.icon,
      tier: d.tier,
      points: POINTS[d.tier],
      ...(unlocks.length ? { unlocks } : {}),
    });
  }
  setDeeds(out, { ...before, done });
  noteMoment(out, now);
  return { state: out, result: { ok: true, done: found.length }, events };
}

export type ChooseResult = { ok: true } | { ok: false; reason: 'unknown' | 'locked' };

/** Shows an honour (or, with null, a title or frame no longer: the banner returns to woad). */
export function choose(state: State, kind: HonourKind, id: string | null): Answer<ChooseResult> {
  const d = deedsOf(state);
  if (id !== null) {
    const h = honourOf(kind, id);
    if (!h) return { state, result: { ok: false, reason: 'unknown' }, events: [] };
    if (!unlocked(h, d.done, pointsOf(state))) return { state, result: { ok: false, reason: 'locked' }, events: [] };
  }
  if (d[kind] === id) return { state, result: { ok: true }, events: [] };
  const out = structuredClone(state);
  setDeeds(out, { ...d, [kind]: id });
  return { state: out, result: { ok: true }, events: [] };
}
