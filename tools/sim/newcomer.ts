// A fresh player's first hour, following the Hearth's goals: every 5 seconds they claim what is
// ready, or press the first goal's button (start it, wear the sword), and stoke the fire; the page
// makes new goals when the ladder lacks one. The brief's first-hour targets are read from this player:
// the first level-up, the first crafted gear worn, the first find, and a notable moment about every
// two minutes, never more than five without one.
import { actionRegistry, FEATURES, type GoalsView } from '@idle-clash/features';
import { createEngine, isNotable, newState, seeded, type GameEvent, type State } from '@idle-clash/kernel';
import { T0 } from './player.ts';

const engine = createEngine(actionRegistry(FEATURES, (f) => f.flag.on));
const feature = (id: string) => FEATURES.find((f) => f.id === id)!;

export interface Newcomer {
  /** Seconds from the first visit until the first level, a weapon worn, the first foe beaten, the first find. */
  levelled: number;
  worn: number;
  fought: number;
  found: number;
  /** First steps claimed in the time allowed. */
  claimed: number;
  /** When each notable moment came, in seconds from the first visit. */
  moments: number[];
}

export function newcomer(seed: number, limitS = 60 * 60): Newcomer {
  const rng = seeded(seed);
  let state: State = newState(seed, T0);
  const out: Newcomer = {
    levelled: Infinity,
    worn: Infinity,
    fought: Infinity,
    found: Infinity,
    claimed: 0,
    moments: [],
  };
  const note = (events: readonly GameEvent[] = []) => {
    for (const e of events) {
      const at = (e.at - T0) / 1000;
      if (isNotable(e)) out.moments.push(at);
      if (e.type === 'levelUp') out.levelled = Math.min(out.levelled, at);
      if (e.type === 'find') out.found = Math.min(out.found, at);
    }
  };
  for (let t = T0; t <= T0 + limitS * 1000; t += 5000) {
    const arrived = engine.input(state, t, rng);
    note(arrived.events);
    state = arrived.state;
    if (state.fireUntil < t + 60_000) state = engine.command(state, t, { type: 'stoke' }, rng).state;
    const view = feature('goals').slots['hearth.goals']({ state, now: t }) as unknown as GoalsView | null;
    if (view?.refresh) state = feature('goals').routes.refresh.run(state, {}, t).state;
    const rows = view?.rows ?? [];
    // What is ready is claimed first; otherwise the first goal with a button is pressed.
    const b =
      rows.find((r) => r.state === 'ready')?.button ?? rows.find((r) => r.state !== 'claimed' && r.button)?.button;
    if (b && 'claim' in b) {
      const ran = feature('goals').routes.claim.run(state, { goal: b.claim }, t);
      note(ran.events);
      state = ran.state;
    } else if (b && 'route' in b)
      state = feature(b.route.feature).routes[b.route.route].run(state, b.route.input, t).state;
    else if (b) {
      const ran = engine.command(state, t, b.command, rng);
      note(ran.events);
      state = ran.state;
    }
    const at = (t - T0) / 1000;
    const worn = (state.features.combat as { worn?: { weapon?: string } } | undefined)?.worn?.weapon;
    if (worn && out.worn === Infinity) out.worn = at;
    if ((state.mastery['combat:hollow-rat'] ?? 0) > 0 && out.fought === Infinity) out.fought = at;
    out.claimed = (state.features.goals as { claimed?: string[] } | undefined)?.claimed?.length ?? 0;
  }
  out.moments = [...new Set(out.moments)].sort((a, b) => a - b);
  return out;
}
