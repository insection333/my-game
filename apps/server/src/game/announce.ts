// After a change is written: tell the player's open pages, and record what happened (hiscores, telemetry,
// notices). Shared by the game's routes and Castle Clash's.
import type { GameEvent, SaveDoc } from '@idle-clash/kernel';
import type { Ctx } from '../context.ts';

/** `byPlayer`: false for a change an admin made (session 231), which is no act of the player's towards their
 *  joining the hiscores. */
export function announce(
  ctx: Ctx,
  playerId: string,
  doc: SaveDoc,
  events: GameEvent[],
  at: number,
  byPlayer = true,
): void {
  ctx.live.publish(playerId, { type: 'state', state: doc.state, now: at });
  if (events.length) ctx.live.publish(playerId, { type: 'events', events });
  // What is recorded is written at once, in one commit rather than one for each row.
  ctx.store.sqlite.transaction(() => {
    if (byPlayer) ctx.hiscores.acted(playerId, at);
    ctx.telemetry.events(playerId, events);
    ctx.notices.add(playerId, events);
    ctx.realm.heard(playerId, events);
    ctx.realmWorks.heard(playerId, events);
    ctx.hiscores.update(playerId, doc.state, at);
  })();
}
