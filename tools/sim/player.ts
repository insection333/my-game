// A simulated player on the real engine: the same rules, content and randomness the server runs.
// The focused player keeps one skill in its lane: one active hour a day with the fire (it stokes and
// picks the best action every minute), then away until the next day.
import { levelFor } from '@idle-clash/content';
import { actionRegistry, FEATURES, skill as kit, type Feature } from '@idle-clash/features';
import {
  createEngine,
  HOUR,
  isNotable,
  MINUTE,
  newState,
  seeded,
  summarizeAway,
  xpOf,
  type AwaySummary,
  type Command,
  type GameEvent,
  type LaneId,
  type State,
} from '@idle-clash/kernel';

export const DAY = 24 * HOUR;
/** A recap of nothing, until the day's is made. */
export const EMPTY: AwaySummary = { from: 0, to: 0, events: [], uncommon: 0, items: {}, xp: {} };
export const T0 = Date.UTC(2026, 0, 5, 8);
const engine = createEngine(actionRegistry(FEATURES, (f) => f.flag.on));

/** XP an hour from an action as things stand (perks and its mastery), with or without the fire. */
export function xpPerHour(state: State, f: Feature, id: string, fire = false): number {
  const sk = f.content.skill!;
  const a = f.content.actions!.find((x) => x.id === id)!;
  const m = kit.actionModifiers(state, sk.id, sk.ladder, f.id, id);
  return ((a.xp! * (fire ? 1.15 : 1)) / (a.seconds! / (1 + m.speed / 100))) * 3600;
}

/** The action earning the most XP an hour among those open at the player's level. */
export function bestAction(state: State, f: Feature): string {
  const level = levelFor(xpOf(state, f.content.skill!.id));
  const open = f.content.actions!.filter((a) => a.level <= level && a.seconds && a.xp !== undefined);
  return open.reduce((a, b) => (xpPerHour(state, f, b.id) > xpPerHour(state, f, a.id) ? b : a)).id;
}

export interface Day {
  /** The state at the start of the day, before the active hour. */
  start: State;
  /** Notable events during the active hour. */
  active: GameEvent[];
  /** Notable events while away. */
  away: GameEvent[];
  /** What the recap would hold on coming back 8 hours after the active hour. */
  recap: AwaySummary;
}

export interface Played {
  /** levelAt[l]: hours from the first visit until level l. */
  levelAt: number[];
  days: Day[];
  commands: number;
  refused: number;
  final: State;
}

/** Every ingredient a feature's actions take: a focused player's stock, kept full (its supply is
 *  someone else's lane). */
const ingredients = (f: Feature) => [
  ...new Set((f.content.actions ?? []).flatMap((a) => (a.takes ?? []).map((t) => t.item))),
];

/**
 * A player who keeps one skill in its lane for `days` days: one active hour a day with the fire, the
 * rest away. A skill that takes ingredients is kept stocked, so its own pace is what is measured.
 */
export function focusedPlayer(f: Feature, seed: number, days: number, lane: LaneId = 'gathering'): Played {
  const skillId = f.content.skill!.id;
  const rng = seeded(seed);
  let state = newState(seed, T0);
  const stock = ingredients(f);
  const levelAt = [0, 0];
  const out: Day[] = [];
  let commands = 0;
  let refused = 0;
  const note = (events: GameEvent[]) => {
    for (const e of events) if (e.type === 'levelUp' && e.skill === skillId) levelAt[e.level] = (e.at - T0) / HOUR;
    return events.filter(isNotable);
  };

  for (let d = 0; d < days; d++) {
    const dayStart = T0 + d * DAY;
    if (stock.length)
      state = { ...state, items: { ...state.items, ...Object.fromEntries(stock.map((i) => [i, 1e6])) } };
    const day: Day = { start: state, active: [], away: [], recap: EMPTY };
    for (let t = dayStart; t < dayStart + HOUR; t += MINUTE) {
      const best = bestAction(state, f);
      const cmd: Command =
        state.lanes[lane].current?.action.id === best
          ? { type: 'stoke' }
          : { type: 'start', lane, action: { feature: f.id, id: best } };
      const r = engine.command(state, t, cmd, rng);
      commands++;
      if (!r.result.ok) refused++;
      state = r.state;
      day.active.push(...note(r.events));
    }
    const eight = engine.advance(state, dayStart + 9 * HOUR, rng);
    const recap = summarizeAway(state, eight.state, eight.events, dayStart + 9 * HOUR);
    const away = engine.advance(state, dayStart + DAY, rng);
    state = away.state;
    // What happened while away is recorded with the next input; the first hour of it ends the active hour.
    const all = note(away.events);
    day.active.push(...all.filter((e) => e.at < dayStart + HOUR));
    day.away.push(...all.filter((e) => e.at >= dayStart + HOUR));
    out.push({ ...day, recap });
  }
  return { levelAt, days: out, commands, refused, final: state };
}

/** Seconds between notable moments within a window, counting from its start and to its end. */
export function gaps(events: GameEvent[], from: number, to: number): number[] {
  const times = events.map((e) => e.at).filter((t) => t >= from && t <= to);
  const marks = [from, ...times, to];
  return marks.slice(1).map((t, i) => (t - marks[i]) / 1000);
}
