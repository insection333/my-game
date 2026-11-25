// Deeds' routes: recording the deeds done (each with its moment, and the honours it unlocked), and
// choosing which honours to show. Pure: each takes the state and returns a new one, an answer and the
// events to announce.
import { noteMoment, type GameEvent, type State } from '@idle-clash/kernel';
import { POINTS, wordsOf } from './content.ts';
import { HONOURS, honourName, honourOf, unlocked, type HonourKind } from './honours.ts';
import { deedById, pending, pointsOf } from './list.ts';
import { deedsOf, FOLLOW, setDeeds, type DeedsState } from './state.ts';

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
      mark: d.mark,
      ...(unlocks.length ? { unlocks } : {}),
    });
  }
  setDeeds(out, { ...before, done });
  noteMoment(out, now);
  return { state: out, result: { ok: true, done: found.length }, events };
}

export type ChooseResult = { ok: true } | { ok: false; reason: 'unknown' | 'locked' };

/** Shows an honour (or, with null, none of that kind: the banner returns to woad, the picture to the forester's,
 *  the scene to the march's). */
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

export type FollowResult = { ok: true } | { ok: false; reason: 'unknown' | 'done' };

/** Follows a deed on the Hearth, or lets it go (session 242): three at most (a fourth lets the first go), never
 *  one done or hidden. */
export function follow(state: State, id: string, on: boolean): { state: State; result: FollowResult; events: [] } {
  const d = deedsOf(state);
  const deed = deedById(id);
  const kept = (d.followed ?? []).filter((x) => x !== id && !Object.hasOwn(d.done, x));
  if (on) {
    if (!deed || deed.hidden) return { state, result: { ok: false, reason: 'unknown' }, events: [] };
    if (Object.hasOwn(d.done, id)) return { state, result: { ok: false, reason: 'done' }, events: [] };
  }
  const out = structuredClone(state);
  const followed = on ? [...kept, id].slice(-FOLLOW) : kept;
  const next: DeedsState = { ...d, followed };
  if (!followed.length) delete next.followed;
  setDeeds(out, next);
  return { state: out, result: { ok: true }, events: [] };
}
