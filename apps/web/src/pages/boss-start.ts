// Fighting a boss from the Expeditions tab (session 72): the boss takes the combat lane, and the fight the
// lane was on is queued next, so the lane goes back to it once the boss is done (a boss rests until
// tomorrow, and the lane fell idle). A Next the player chose is left as it is. A run or a descent the lane was
// on is taken up again too (session 239: the day's bosses press in the middle of a run).
import { hasString } from '@idle-clash/content';
import type { RoundView } from '@idle-clash/features';
import type { ActionRef, Command, State } from '@idle-clash/kernel';

/** An action the lane goes back to after a boss: a fight, a run into a region, a descent. */
const resumable = (a: ActionRef) =>
  a.feature === 'combat' ||
  (a.feature === 'expeditions' && (a.id === 'deep' || hasString(`combat.region.${a.id}.short`)));

export function bossCommands(state: State, boss: string): Command[] {
  const lane = state.lanes.combat;
  const start: Command = { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: boss } };
  const was = lane.current?.action;
  return was && resumable(was) && !lane.next ? [start, { type: 'queueNext', lane: 'combat', action: was }] : [start];
}

/** Whether a fight is in the lane as one of the day's bosses (session 239): under way, or to come. */
export function inRound(round: RoundView | null, id: string): 'on' | 'waiting' | null {
  if (!round?.running) return null;
  return round.on === id ? 'on' : round.waiting.includes(id) ? 'waiting' : null;
}
