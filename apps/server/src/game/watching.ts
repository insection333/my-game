// Hiscores for players who are only watching. A save is written when its player acts, and the
// hiscores hear of it then; a page left open on a running lane acts on nothing, so every few seconds
// the server reads the longest-unheard of the players watching, advanced to now, into the hiscores.
// The save itself is not written: it advances the same way when they next act.
import { seeded } from '@idle-clash/kernel';
import type { Ctx } from '../context.ts';

export const WATCH_EVERY_MS = 10_000;
/** Players read on each tick, so a tick stays short however many are watching. */
export const WATCH_PER_TICK = 2;
/** How long the hiscores may go without hearing of a player who is watching. */
export const STALE_AFTER_MS = 2 * 60_000;

/** Reads a player's save, advanced to now, into the hiscores. */
export function hear(ctx: Ctx, playerId: string, now: number): void {
  const saved = ctx.store.read(playerId, now);
  if (!saved) return;
  const out = ctx.engine.advance(saved.doc.state, now, seeded(saved.doc.state.seed));
  ctx.hiscores.update(playerId, out.state, now);
}

/** One tick: the players watching whom the hiscores heard of longest ago. Returns how many were read. */
export async function hearWatching(ctx: Ctx): Promise<number> {
  const now = ctx.config.now();
  const due = ctx.live
    .players()
    .map((id) => ({ id, at: ctx.hiscores.heardAt(id) }))
    .filter((p) => now - p.at >= STALE_AFTER_MS)
    .sort((a, b) => a.at - b.at)
    .slice(0, WATCH_PER_TICK);
  for (const { id } of due) await ctx.queue.run(id, () => hear(ctx, id, ctx.config.now()));
  return due.length;
}
