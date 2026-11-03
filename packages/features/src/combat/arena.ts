// The arena (session 42): the fight in the Combat lane, swing by swing, as the Combat page plays it out.
// Each fight is decided by the seed its repetition drew when it began (rules.ts), so the page can play
// the very same fight the engine will settle: the same hits, the same misses, the same meals, at the
// second each falls. Nothing here changes the game; it only shows it.
import { seeded, type State } from '@idle-clash/kernel';
import { foeById, type Foe } from '../shared/combat/data.ts';
import { fight, maxHealth, type Fought, type Swing } from '../shared/combat/fight.ts';
import { fighterOf, healthAt, mealsOf } from '../shared/combat/state.ts';

export interface Arena {
  foe: Foe;
  /** When this fight began and when it ends (the next foe arrives, or the retreat). */
  startedAt: number;
  endsAt: number;
  /** Health at the start, and the most it can be. */
  health: number;
  most: number;
  swings: Swing[];
  fought: Fought;
}

/** The fight the Combat lane is in, or null when it is not fighting a foe. */
export function arenaOf(state: State): Arena | null {
  const run = state.lanes.combat.current;
  if (!run || run.action.feature !== 'combat' || run.seed === undefined) return null;
  const foe = foeById(run.action.id);
  const p = foe ? fighterOf(state, foe) : null;
  if (!foe || !p) return null;
  // As the rules play it: the same seed, the same draws in the same order, the health it began with.
  const r = seeded(run.seed);
  let i = 0;
  const health = healthAt(state, run.startedAt);
  const swings: Swing[] = [];
  const fought = fight(
    p,
    foe,
    () => r('fight', i++),
    health,
    mealsOf(state),
    {},
    (s) => swings.push(s),
  );
  return { foe, startedAt: run.startedAt, endsAt: run.endsAt, health, most: maxHealth(p), swings, fought };
}
