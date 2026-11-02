// After a change is written: tell the player's open pages, and record what happened (hiscores, telemetry,
// notices). Shared by the game's routes and Castle Clash's.
import type { GameEvent, SaveDoc } from '@idle-clash/kernel';
import type { Ctx } from '../context.ts';

export function announce(ctx: Ctx, playerId: string, doc: SaveDoc, events: GameEvent[], at: number): void {
  ctx.live.publish(playerId, { type: 'state', state: doc.state, now: at });
  if (events.length) ctx.live.publish(playerId, { type: 'events', events });
  // What is recorded is written at once, in one commit rather than one for each row.
  ctx.store.sqlite.transaction(() => {
    ctx.hiscores.acted(playerId, at);
    ctx.telemetry.events(playerId, events);
    ctx.notices.add(playerId, events);
    ctx.hiscores.update(playerId, doc.state, at);
  })();
}
