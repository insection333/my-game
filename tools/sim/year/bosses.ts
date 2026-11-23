// The day's bosses as a player fights them (session 210): the Hearth's Next up names the bosses that can be
// fought today among those rated Easy or Fair (session 188), and Fight on one takes the Combat lane for the
// fight and queues what it ran to follow. A player fights them one after another from the visit's start, once
// each a day, while the lane fights a foe, never over an expedition.
import type { Command, State } from '@idle-clash/kernel';
import { bossRows } from '../../../packages/features/src/expeditions/views.ts';

/** The commands that fight the first boss ready today and go back to the foe after, or none. */
export function dailyBoss(state: State, now: number): Command[] {
  const current = state.lanes.combat.current?.action;
  if (current?.feature !== 'combat' || state.lanes.combat.next) return [];
  const boss = bossRows(state, now).find((b) => b.ready && (b.verdictId === 'easy' || b.verdictId === 'fair'));
  if (!boss) return [];
  return [
    { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: boss.id } },
    { type: 'queueNext', lane: 'combat', action: { feature: current.feature, id: current.id } },
  ];
}
