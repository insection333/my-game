// Session 240: a lane holds three to come. Next held one action, so "smelt, then forge, then smith" took three
// visits; now Next and two more wait in order, each taking over as the one before stops, a refused one passing
// to the next, and a save keeps them.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  countOf,
  createEngine,
  give,
  mend,
  newState,
  queueOf,
  registryOf,
  seeded,
  SECOND,
  take,
  type ActionRules,
  type Command,
  type SaveDoc,
  type State,
} from '../src/index.ts';
import { T0 } from './fixtures.ts';

/** An artisan action that turns one of an item into another, two seconds a go. */
const make = (from: string, to: string): ActionRules => ({
  lane: 'artisan',
  check: (ctx) => (countOf(ctx.state, from) ? null : { code: 'outOfInputs', detail: { item: from } }),
  duration: () => 2000,
  complete: (ctx) => {
    take(ctx.state, from, 1);
    give(ctx.state, to, 1);
  },
});
const engine = createEngine(
  registryOf({
    smithing: {
      a: make('ore', 'bar'),
      b: make('bar', 'blade'),
      c: make('blade', 'sword'),
      d: make('x', 'y'),
      e: make('y', 'z'),
    },
  }),
);
const act = (id: string) => ({ feature: 'smithing', id });
const rng = seeded(240);
const run = (s: State, cmd: Command) => {
  const out = engine.command(s, T0, cmd, rng);
  expect(out.result).toEqual({ ok: true });
  return out.state;
};
const queued = (s: State, ...ids: string[]) =>
  ids.reduce((x, id) => run(x, { type: 'queueNext', lane: 'artisan', action: act(id) }), s);
/** Smelting two ore, then Next: forge the blades, then the swords. */
function smelting(...ids: string[]) {
  const s = newState(240, T0);
  s.items.ore = 2;
  return queued(run(s, { type: 'start', lane: 'artisan', action: act('a') }), ...ids);
}

describe('a lane of three to come', () => {
  it('takes each in order as the one before stops', () => {
    const s = smelting('b', 'c');
    expect(queueOf(s.lanes.artisan)).toEqual([act('b'), act('c')]);
    const { state, events } = engine.advance(s, T0 + 20 * SECOND, rng);
    const started = events.flatMap((e) => (e.type === 'nextStarted' ? [e.action.id] : []));
    expect(started).toEqual(['b', 'c']);
    expect(state.items).toEqual({ sword: 2 });
    expect(state.lanes.artisan.next).toBeNull();
    expect(state.lanes.artisan.then).toBeUndefined();
  });

  it('holds three, refusing a fourth, one already to come and the one it runs', () => {
    const s = smelting('b', 'c', 'd');
    const refused = (id: string) =>
      engine.command(s, T0, { type: 'queueNext', lane: 'artisan', action: act(id) }, rng).result;
    expect(refused('c')).toEqual({ ok: false, reason: { code: 'alreadyQueued' } });
    expect(refused('a')).toEqual({ ok: false, reason: { code: 'alreadyRunning' } });
    expect(refused('e')).toEqual({ ok: false, reason: { code: 'queueFull', detail: { most: 3 } } });
    expect(queueOf(s.lanes.artisan)).toEqual([act('b'), act('c'), act('d')]);
  });

  it('passes over one that cannot start to the next that can', () => {
    const s = smelting('d', 'b');
    const { state, events } = engine.advance(s, T0 + 10 * SECOND, rng);
    const said = events.map((e) => `${e.type} ${'action' in e && e.action ? e.action.id : ''}`);
    expect(said).toEqual(['laneStopped a', 'laneStopped d', 'nextStarted b', 'laneStopped b']);
    expect(state.items).toEqual({ blade: 2 });
    expect(queueOf(state.lanes.artisan)).toEqual([]);
  });

  it('lets one go by its place, or all of them', () => {
    const s = smelting('b', 'c', 'd');
    const clear = (at?: number) =>
      queueOf(run(s, { type: 'clearNext', lane: 'artisan', ...(at === undefined ? {} : { at }) }).lanes.artisan);
    expect(clear(0)).toEqual([act('c'), act('d')]);
    expect(clear(1)).toEqual([act('b'), act('d')]);
    expect(clear(2)).toEqual([act('b'), act('c')]);
    expect(clear()).toEqual([]);
  });

  it('is kept by a save, and mended when damaged', () => {
    const doc = JSON.parse(readFileSync(new URL('./saves/v2.json', import.meta.url), 'utf8')) as SaveDoc;
    const now = doc.state.clock + 1000;
    doc.state.lanes.artisan.next = act('a');
    doc.state.lanes.artisan.then = [act('b')];
    expect(mend(structuredClone(doc), now)).toEqual({ doc, repairs: [] });
    const raw = structuredClone(doc) as unknown as { state: { lanes: { artisan: Record<string, unknown> } } };
    raw.state.lanes.artisan.next = null;
    raw.state.lanes.artisan.then = [{ feature: 'Bad Id' }, act('b'), act('c'), act('d'), act('a')];
    const mended = mend(raw, now);
    expect(queueOf(mended.doc.state.lanes.artisan)).toEqual([act('b'), act('c'), act('d')]);
    expect(mended.repairs.filter((r) => r.includes('after Next'))).toHaveLength(1);
  });
});
