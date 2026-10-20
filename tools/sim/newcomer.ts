// A fresh player who follows First steps on the Hearth: every 5 seconds they press the first step's
// button (start it, wear the sword, claim it) and stoke the fire. The brief's target: the first crafted
// gear is worn within 15 minutes; then the first fight.
import { actionRegistry, FEATURES, type GoalsView } from '@idle-clash/features';
import { createEngine, newState, seeded, type State } from '@idle-clash/kernel';
import { T0 } from './player.ts';

const engine = createEngine(actionRegistry(FEATURES, (f) => f.flag.on));
const feature = (id: string) => FEATURES.find((f) => f.id === id)!;

export interface Newcomer {
  /** Seconds from the first visit until a weapon is worn, and until the first foe is beaten. */
  worn: number;
  fought: number;
  /** The steps claimed in the time allowed. */
  claimed: number;
}

export function newcomer(seed: number, limitS = 30 * 60): Newcomer {
  const rng = seeded(seed);
  let state: State = newState(seed, T0);
  const out: Newcomer = { worn: Infinity, fought: Infinity, claimed: 0 };
  for (let t = T0; t <= T0 + limitS * 1000; t += 5000) {
    state = engine.input(state, t, rng).state;
    if (state.fireUntil < t + 60_000) state = engine.command(state, t, { type: 'stoke' }, rng).state;
    const view = feature('goals').slots['hearth.goals']({ state, now: t }) as unknown as GoalsView;
    const row = view.rows.find((r) => r.state !== 'claimed' && r.button);
    const b = row?.button;
    if (b && 'claim' in b) state = feature('goals').routes.claim.run(state, { goal: b.claim }, t).state;
    else if (b && 'route' in b)
      state = feature(b.route.feature).routes[b.route.route].run(state, b.route.input, t).state;
    else if (b) state = engine.command(state, t, b.command, rng).state;
    const at = (t - T0) / 1000;
    const worn = (state.features.combat as { worn?: { weapon?: string } } | undefined)?.worn?.weapon;
    if (worn && out.worn === Infinity) out.worn = at;
    if ((state.mastery['combat:hollow-rat'] ?? 0) > 0 && out.fought === Infinity) out.fought = at;
    out.claimed = view.rows.filter((r) => r.state === 'claimed').length;
  }
  return out;
}
