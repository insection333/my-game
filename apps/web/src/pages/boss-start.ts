// Fighting a boss from the Expeditions tab (session 72): the boss takes the combat lane, and the fight the
// lane was on is queued next, so the lane goes back to it once the boss is done (a boss rests until
// tomorrow, and the lane fell idle). A Next the player chose is left as it is.
import type { Command, State } from '@idle-clash/kernel';

export function bossCommands(state: State, boss: string): Command[] {
  const lane = state.lanes.combat;
  const start: Command = { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: boss } };
  const was = lane.current?.action;
  return was && was.feature === 'combat' && !lane.next
    ? [start, { type: 'queueNext', lane: 'combat', action: was }]
    : [start];
}
