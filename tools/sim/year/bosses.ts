// The day's bosses as a player fights them (session 210): the Hearth's Next up names the bosses that can be
// fought today among those rated Easy or Fair (session 188), and Fight on one takes the Combat lane for the
// fight and queues what it ran to follow. A player fights them one after another from the visit's start, once
// each a day, while the lane fights a foe, never over an expedition.
import type { Command, State } from '@idle-clash/kernel';
import { bossById } from '../../../packages/features/src/shared/expeditions/data.ts';
import { oddsFor } from '../../../packages/features/src/shared/combat/odds.ts';
import { bossRows } from '../../../packages/features/src/expeditions/views.ts';

/** The commands that fight the first boss ready today and go back to the foe after, or none. A boss whose
 *  fight would outlast the visit waits (session 211: the bosses' ways lengthen their fights, and one still
 *  under way as the player left kept the night's expedition from setting out). */
export function dailyBoss(state: State, now: number, leaving: number): Command[] {
  const current = state.lanes.combat.current?.action;
  if (current?.feature !== 'combat' || state.lanes.combat.next) return [];
  const boss = bossRows(state, now).find((b) => {
    if (!b.ready || (b.verdictId !== 'easy' && b.verdictId !== 'fair')) return false;
    const odds = oddsFor(state, bossById(b.id)!);
    return odds !== null && now + odds.secondsPerFight * 1000 < leaving;
  });
  if (!boss) return [];
  return [
    { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: boss.id } },
    // One Next, as a lane held before session 240.
    { type: 'clearNext', lane: 'combat' },
    { type: 'queueNext', lane: 'combat', action: { feature: current.feature, id: current.id } },
  ];
}
