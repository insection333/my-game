// A run that stopped by itself, said on its own card (session 120): why, in the lane's own words, the same
// remedy the lanes and the away recap offer, and whether Carry on would now be taken. A run the player
// paused, or a stop on another action, says nothing here.
import { formatStop, isQuietStop } from '@idle-clash/content';
import { remedyFor, type Remedy } from '@idle-clash/features';
import { actionKey, type ActionRef, type State } from '@idle-clash/kernel';

export interface RunStopped {
  why: string;
  fix: Remedy | null;
  again: boolean;
}

export function runStopped(
  state: State,
  region: string,
  canStart: (lane: 'combat', action: ActionRef) => boolean,
): RunStopped | null {
  const stop = state.lanes.combat.stopped;
  if (!stop?.action || actionKey(stop.action) !== `expeditions:${region}` || isQuietStop(stop.reason.code)) return null;
  return {
    why: formatStop(stop.reason),
    fix: remedyFor(stop.reason, stop.action),
    again: canStart('combat', stop.action),
  };
}
