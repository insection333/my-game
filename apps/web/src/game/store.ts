// The game as the page sees it. Until the server arrives (session 5) the page runs the same kernel
// engine itself, so every screen is live. The clock ticks only while something is moving, so a
// resting page uses no CPU.
import { actionRegistry, FEATURES, type Feature } from '@idle-clash/features';
import { createEngine, newState, seeded, type Command, type GameEvent, type State } from '@idle-clash/kernel';

export interface GameView {
  state: State;
  now: number;
  events: GameEvent[];
  features: readonly Feature[];
}

/** `?features=all` switches on every built feature, for previews and verify's screenshots. */
function chosenFeatures(): readonly Feature[] {
  let all = false;
  try {
    const q = new URLSearchParams(location.search).get('features');
    if (q === 'all') sessionStorage.setItem('features', 'all');
    all = q === 'all' || sessionStorage.getItem('features') === 'all';
  } catch {
    all = new URLSearchParams(location.search).get('features') === 'all';
  }
  return FEATURES.filter((f) => all || f.flag.on);
}

const features = chosenFeatures();
const engine = createEngine(actionRegistry(features, () => true));
const seed = 20261020;
const rng = seeded(seed);

let view: GameView = { state: newState(seed, Date.now()), now: Date.now(), events: [], features };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

const busy = (s: State, now: number) => now < s.fireUntil || Object.values(s.lanes).some((l) => l.current);

function publish(next: GameView) {
  view = next;
  for (const l of listeners) l();
  const needsClock = busy(view.state, view.now);
  if (needsClock && !timer) timer = setInterval(tick, 1000);
  if (!needsClock && timer) {
    clearInterval(timer);
    timer = null;
  }
}

function tick() {
  if (document.hidden) return;
  const now = Date.now();
  const out = engine.advance(view.state, now, rng);
  publish({ ...view, state: out.state, now, events: [...view.events, ...out.events].slice(-50) });
}

export const game = {
  get: () => view,
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  command: (cmd: Command) => {
    const now = Date.now();
    const out = engine.command(view.state, now, cmd, rng);
    publish({ ...view, state: out.state, now, events: [...view.events, ...out.events].slice(-50) });
    return out.result;
  },
};
