// Session 239: a day that flows. A run home with its boss beaten sets out again, so a day away keeps the
// Combat lane at work (an eight-hour run left it idle for sixteen hours of a day away); and the day's bosses
// are fought one after another from one press, each as it is fought alone, before the lane goes back to what
// it was on.
import { HOUR, seeded, summarizeAway, type GameEvent, type State } from '@idle-clash/kernel';
import { recap } from '../src/index.ts';
import { describe, expect, it } from 'vitest';
import { expeditionsOf } from '../src/shared/expeditions/state.ts';
import { roundOn } from '../src/shared/expeditions/round.ts';
import { nextRoute } from '../src/expeditions/route.ts';
import { setAgain, setOut } from '../src/expeditions/routes.ts';
import { planRound, roundFoes, roundView } from '../src/expeditions/round.ts';
import { expeditionView } from '../src/expeditions/views.ts';
import { engine, fighterAt, T0 } from './helpers/expedition.ts';

const RUN = { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: 'march' } } as const;

/** A fighter at the top of the march set out on an eight-hour run, then away a day. */
function dayAway(prepare: (s: State) => State = (s) => s) {
  let s = fighterAt('march', 11);
  s = setOut(s, 'march', 8, nextRoute(s, 'march', 8)!.roads[0]).state;
  s = prepare(engine.command(s, T0, RUN, seeded(11)).state);
  const out = engine.advance(s, T0 + 24 * HOUR, seeded(11));
  return { state: out.state, events: out.events };
}

/** How much of a span the Combat lane worked: from its start to its first stop. */
const busy = (events: GameEvent[], span: number) => {
  const stop = events.find((e) => e.type === 'laneStopped' && e.lane === 'combat');
  return ((stop ? stop.at : T0 + span) - T0) / span;
};

describe('a run home with its boss beaten', () => {
  it('sets out again, so a day away keeps the Combat lane at work', () => {
    const { state, events } = dayAway();
    const home = events.filter((e) => e.type === 'expeditionDone');
    expect(home.length).toBeGreaterThanOrEqual(2);
    expect(home.every((e) => e.type === 'expeditionDone' && e.outcome === 'won')).toBe(true);
    expect(busy(events, 24 * HOUR)).toBeGreaterThanOrEqual(0.95);
    expect(state.lanes.combat.current?.action).toEqual(RUN.action);
    // A new route, the same length and region; the last run home kept in view above it.
    const e = expeditionsOf(state);
    expect(e.run).toMatchObject({ region: 'march', hours: 8 });
    expect(e.drawn).toBe(home.length + 1);
    expect(expeditionView(state, T0 + 24 * HOUR).last).not.toBeNull();
    // The runs home said in one line of the recap, where each told its whole story.
    const lines = recap
      .recapLines(summarizeAway(fighterAt('march', 11), state, events, 24 * HOUR))
      .filter((l) => l.kind === 'expedition' && !/fought|struck|held/.test(l.text));
    const marks = home.reduce((n, e) => n + (e.type === 'expeditionDone' ? e.marks : 0), 0);
    expect(lines.map((l) => l.text)).toEqual([
      `${home.length} runs came home (${home.length} with the boss beaten), bringing ${marks.toLocaleString('en-GB')} marks`,
    ]);
  });

  it('rests the lane once home when the player turned it off', () => {
    const { state, events } = dayAway((s) => setAgain(s, false).state);
    expect(events.filter((e) => e.type === 'expeditionDone')).toHaveLength(1);
    expect(busy(events, 24 * HOUR)).toBeLessThan(0.4);
    expect(state.lanes.combat.stopped?.reason.code).toBe('expeditionHome');
    expect(expeditionView(state, T0 + 24 * HOUR).again).toBe(false);
  });

  it('gives way to a Next the player queued', () => {
    const foe = { feature: 'combat', id: 'goblin-slinger' };
    const { state, events } = dayAway(
      (s) => engine.command(s, T0, { type: 'queueNext', lane: 'combat', action: foe }, seeded(11)).state,
    );
    expect(events.filter((e) => e.type === 'expeditionDone')).toHaveLength(1);
    expect(state.lanes.combat.current?.action).toEqual(foe);
    expect(expeditionsOf(state).run).toBeNull();
  });
});

describe("the day's bosses", () => {
  const BOSSES = { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: 'bosses' } } as const;

  it('fights each boss the player fares well against once, then gives the lane back', () => {
    let s = fighterAt('peaks', 12);
    const foes = roundFoes(s, T0);
    expect(foes.length).toBeGreaterThanOrEqual(2);
    expect(roundView(s, T0)!.text).toBe(`${foes.length} to fight today, one after another`);
    const fight = { feature: 'combat', id: 'goblin-slinger' };
    s = engine.command(s, T0, { type: 'start', lane: 'combat', action: fight }, seeded(12)).state;
    s = planRound(s, T0).state;
    s = engine.command(s, T0, BOSSES, seeded(12)).state;
    s = engine.command(s, T0, { type: 'queueNext', lane: 'combat', action: fight }, seeded(12)).state;
    expect(roundOn(s, T0)).toBe(foes[0]);
    expect(roundView(s, T0)).toMatchObject({ running: true, on: foes[0], waiting: foes.slice(1) });
    const out = engine.advance({ ...s, lastSeen: T0 + 3 * HOUR }, T0 + 3 * HOUR, seeded(12));
    const fought = out.events.filter((e) => e.type === 'bossFought').map((e) => e.type === 'bossFought' && e.boss);
    expect(fought).toEqual(foes);
    // Each rests until tomorrow, as when fought alone, and nothing more is asked of the round.
    expect(roundFoes(out.state, T0 + 3 * HOUR)).toEqual([]);
    expect(out.events.find((e) => e.type === 'laneStopped')).toMatchObject({ reason: { code: 'roundDone' } });
    expect(out.state.lanes.combat.current?.action).toEqual(fight);
  });

  it('is refused with nothing to fight, and a list set yesterday fights nothing today', () => {
    const s = fighterAt('march', 13);
    const set = planRound(s, T0).state;
    const tomorrow = T0 + 24 * HOUR;
    expect(roundOn(set, tomorrow)).toBeNull();
    expect(engine.command(set, tomorrow, BOSSES, seeded(13)).result).toEqual({
      ok: false,
      reason: { code: 'roundDone' },
    });
    const fought = { ...set, features: { ...set.features, expeditions: { ...expeditionsOf(set), bossDay: {} } } };
    const all = Object.fromEntries(roundFoes(fought, T0).map((id) => [id, '2026-10-28']));
    const rested = { ...set, features: { ...set.features, expeditions: { ...expeditionsOf(set), bossDay: all } } };
    expect(planRound(rested, T0).result).toEqual({ ok: false, reason: 'none' });
  });
});
