// Whether a fighter can take on a foe now (moved from rules.ts in session 268, so the rows the page draws ask
// what the lane's own check asks: a boss row and the realm's said ready while the Storehouse had no room for
// what the fight drops, and Fight was refused).
import type { StopReason, State } from '@idle-clash/kernel';
import { maxHealth, retreatShare } from '../shared/combat/fight.ts';
import { fighterOf, healthAt, mealsOf } from '../shared/combat/state.ts';
import type { Foe } from '../shared/combat/data.ts';
import { noRoom } from '../shared/storehouse.ts';

/** Why a fighter cannot take on a foe now: no weapon, hurt with nothing to eat, or no room for its drop. */
export function unfit(state: State, at: number, foe: Foe, gives: string[]): StopReason | null {
  const p = fighterOf(state, foe);
  if (!p) return { code: 'noWeapon' };
  const low = healthAt(state, at) < maxHealth(p) * retreatShare(p);
  if (low && mealsOf(state).length === 0) return { code: 'tooHurt' };
  return noRoom(state, gives);
}
