// A year's player on the real engine: visits at set hours each day (the steady player one active hour
// with the fire; the light player two short looks), deciding every ten minutes of a visit what each
// lane runs (plan.ts) and keeping house (house.ts); away between visits. Everything that happens is
// recorded by day, for the year's checks.
import { actionRegistry, combatData, FEATURES, storehouseData } from '@idle-clash/features';
import {
  createEngine,
  HOUR,
  isNotable,
  MINUTE,
  newState,
  seeded,
  type Command,
  type GameEvent,
  type LaneId,
  type State,
} from '@idle-clash/kernel';
import { nextRoute } from '../../../packages/features/src/expeditions/route.ts';
import { bestFoe } from '../combat.ts';
import { DAY, T0 } from '../player.ts';
import { equip, feed, goalsAndDeeds, raiseRelics, styleToTrain, takePaths, tidy } from './house.ts';
import { artisanPlan, artisanStock, behind, bestGather, gatherFor, scarcest } from './plan.ts';
import { ACTS, ALL_SKILLS, GATHERING, type Act } from './world.ts';

const engine = createEngine(actionRegistry(FEATURES, (f) => f.flag.on));
const LANES: LaneId[] = ['gathering', 'artisan', 'combat'];

export interface Kind {
  name: string;
  /** Each visit: the hour of the day it starts, and its minutes. */
  visits: { hour: number; minutes: number }[];
  /** From which day it sends its fighter on expeditions overnight. */
  expeditionsFrom: number;
}
export const STEADY: Kind = { name: 'The steady player', visits: [{ hour: 0, minutes: 60 }], expeditionsFrom: 14 };
export const LIGHT: Kind = {
  name: 'The light player',
  visits: [
    { hour: 0, minutes: 10 },
    { hour: 12, minutes: 5 },
  ],
  expeditionsFrom: 21,
};

export interface YearDay {
  day: number;
  /** Notable events during the day's visits, and all the day's notable events. */
  active: GameEvent[];
  events: GameEvent[];
  /** What was new: a level, a tier, a mastery step, a deed, a title, a boss, a relic, a find, a Kindling. */
  firsts: string[];
  /** Seconds each lane stood idle while away, and why lanes stopped. */
  idle: Record<string, number>;
  stops: Record<string, number>;
  gold: number;
  slots: [number, number];
  /** What each lane was left running (and what was queued). */
  lanes?: Record<string, string>;
}
export interface Year {
  kind: Kind;
  days: YearDay[];
  /** The day each skill reached 99. */
  at99: Record<string, number>;
  final: State;
  commands: number;
  refused: number;
  /** Refusals by command and reason. */
  why: Record<string, number>;
}

const TIER_LEVELS = [10, 20, 30, 40, 55, 70, 85];

/** Plays `days` days (or until every skill is at 99 after a year); `onDay` sees each day's end. */
export function playYear(kind: Kind, seed: number, days: number, onDay?: (day: number, state: State) => void): Year {
  const rng = seeded(seed);
  let state = newState(seed, T0);
  const out: Year = { kind, days: [], at99: {}, final: state, commands: 0, refused: 0, why: {} };
  const beaten = new Set<string>();
  let left = T0;
  let today: YearDay | null = null;
  let making: string | null = null;
  const note = (events: readonly GameEvent[], during: [number, number] | null) => {
    const day = today!;
    for (const e of events) {
      if (e.type === 'laneStopped') day.stops[e.reason.code] = (day.stops[e.reason.code] ?? 0) + 1;
      if (!isNotable(e)) continue;
      day.events.push(e);
      if (during && e.at >= during[0] && e.at <= during[1]) day.active.push(e);
      if (e.type === 'levelUp') {
        day.firsts.push(TIER_LEVELS.includes(e.level) ? `tier:${e.skill}` : `level:${e.skill}`);
        if (e.level === 99) out.at99[e.skill] ??= day.day;
      }
      if (e.type === 'deedDone') day.firsts.push(e.unlocks?.length ? 'title' : 'deed');
      if (e.type === 'find' && e.first) day.firsts.push('find');
      if (e.type === 'kindled') day.firsts.push('kindling');
      if (e.type === 'masteryStep') day.firsts.push('mastery');
      if (e.type === 'expeditionDone' && e.outcome === 'won' && !beaten.has(e.boss)) {
        beaten.add(e.boss);
        day.firsts.push('boss');
      }
    }
  };
  const run = (t: number, c: Command, window: [number, number]) => {
    const r = engine.command(state, t, c, rng);
    out.commands++;
    if (!r.result.ok) {
      out.refused++;
      const key = `${c.type}:${'action' in c ? c.action.id : ''}:${r.result.reason.code}`;
      out.why[key] = (out.why[key] ?? 0) + 1;
    }
    state = r.state;
    note(r.events, window);
    return r.result.ok;
  };

  for (let d = 0; d < days; d++) {
    const day: YearDay = {
      day: d + 1,
      active: [],
      events: [],
      firsts: [],
      idle: {},
      stops: {},
      gold: 0,
      slots: [0, 0],
    };
    today = day;
    for (const v of kind.visits) {
      const from = T0 + d * DAY + v.hour * HOUR;
      const window: [number, number] = [from, from + v.minutes * MINUTE];
      for (let m = 0; m < v.minutes; m++) {
        const t = from + m * MINUTE;
        const arrived = engine.input(state, t, rng);
        state = arrived.state;
        note(arrived.events, window);
        if (m === 0)
          for (const lane of LANES) {
            const l = state.lanes[lane];
            if (!l.current && l.stopped)
              day.idle[lane] = (day.idle[lane] ?? 0) + (t - Math.max(l.stopped.at, left)) / 1000;
          }
        if (state.fireUntil < t + 2 * MINUTE) run(t, { type: 'stoke' }, window);
        // Lanes set first, so goals made now follow the day's work.
        const leaving = m === v.minutes - 1;
        // A piece of gear being made is taken as soon as it comes, and the lane turned back to training.
        const made = making !== null && (state.items[making] ?? 0) > 0;
        if (m % 10 === 0 || leaving || made) manage(t, leaving, window, m === 0 || leaving || made);
        const g = goalsAndDeeds(state, t, m % 5 === 0);
        state = g.state;
        note(g.events, window);
      }
      left = window[1];
    }
    day.gold = state.items.gold ?? 0;
    day.lanes = Object.fromEntries(
      LANES.map((l) => [l, `${state.lanes[l].current?.action.id ?? '-'}>${state.lanes[l].next?.id ?? ''}`]),
    );
    day.slots = [storehouseData.slotsUsed(state), storehouseData.capacity(state)];
    out.days.push(day);
    onDay?.(d + 1, state);
    if (ALL_SKILLS.every((s) => out.at99[s]) && d + 1 >= 365) break;
  }
  out.final = state;
  return out;

  /** Every lane set as the plan says; on leaving, the house kept and the long run set up. */
  /** On arriving and leaving every lane is set as the plan says (`settle`); in between, a lane is only
   *  set when it stands idle, or for a piece of gear, so the work of the visit (and its goals) holds. */
  function manage(t: number, leaving: boolean, window: [number, number], settle: boolean) {
    const day = out.days.length + 1;
    if (leaving || t === window[0]) state = tidy(state, t);
    if (leaving) {
      state = takePaths(state, t);
      const r = raiseRelics(state, t);
      state = r.state;
      if (r.bought) dayFirst('relic');
    }
    // Gathering: feed the artisan lane while it holds under half a day's work; otherwise level.
    const low = artisanStock(state) < 12 * 3600 ? scarcest(state) : null;
    const lowest = behind(state, GATHERING);
    const main = (low && gatherFor(state, low)) || bestGather(state, lowest[0]);
    // A skill works one lane at a time: the fire's lane gives it up first.
    const second = state.lanes.gathering2.current?.action;
    if (main && settle && skillOf(second) === main.skill) run(t, { type: 'stop', lane: 'gathering2' }, window);
    if (settle || !state.lanes.gathering.current) setLane('gathering', main, t, window);
    if (state.fireUntil > t && !leaving && (settle || !state.lanes.gathering2.current)) {
      const other = lowest.find((s) => s !== skillOf(state.lanes.gathering.current?.action));
      if (other) setLane('gathering2', bestGather(state, other), t, window);
    }
    // Artisan: now, and what follows when its inputs run out.
    const plan = artisanPlan(state, leaving ? 23 * 60 : 10, leaving);
    making = plan.making;
    if (!settle && !plan.making && state.lanes.artisan.current) return combatLane();
    setLane('artisan', plan.now, t, window);
    if (plan.next && plan.next !== plan.now)
      run(t, { type: 'queueNext', lane: 'artisan', action: { feature: plan.next.feature, id: plan.next.id } }, window);
    combatLane();

    function combatLane() {
      // Combat: the style furthest behind, its best gear on, food in hand; overnight, an expedition.
      if (!settle && state.lanes.combat.current) return;
      fight();
    }
    function fight() {
      const style = styleToTrain(state);
      if (!style) return;
      state = feed(equip(state, style, t), t);
      const current = state.lanes.combat.current?.action;
      if (current?.feature === 'expeditions') return;
      const foe = bestFoe(state);
      if (leaving && day >= kind.expeditionsFrom && expedition(t, foe, window)) return;
      if (current?.id !== foe)
        run(t, { type: 'start', lane: 'combat', action: { feature: 'combat', id: foe } }, window);
    }
  }

  function skillOf(a: { feature: string; id: string } | undefined) {
    return a ? ACTS.find((x) => x.feature === a.feature && x.id === a.id)?.skill : undefined;
  }

  function setLane(lane: LaneId, act: Act | null, t: number, window: [number, number]) {
    if (!act) return;
    const cur = state.lanes[lane].current?.action;
    if (cur?.feature === act.feature && cur.id === act.id) return;
    run(t, { type: 'start', lane, action: { feature: act.feature, id: act.id } }, window);
  }

  /** An eight-hour run into the region of the best foe, the fight queued behind it for the rest of the night. */
  function expedition(t: number, foe: string, window: [number, number]): boolean {
    const f = combatData.foeById(foe);
    if (!f) return false;
    const region = combatData.regionOf(f.tier);
    const route = nextRoute(state, region, 8);
    if (!route) return false;
    const set = FEATURES.find((x) => x.id === 'expeditions')!.routes.setOut.run(
      state,
      { region, hours: 8, road: route.roads[0] },
      t,
    );
    if (!(set.result as { ok: boolean }).ok) return false;
    state = set.state;
    if (!run(t, { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: region } }, window))
      return false;
    run(t, { type: 'queueNext', lane: 'combat', action: { feature: 'combat', id: foe } }, window);
    return true;
  }

  function dayFirst(what: string) {
    today?.firsts.push(what);
  }
}
