// A player's total level for the admin page: from the hiscores when they have a row there, and from
// the save when they do not yet (rows are written once a player has XP, so a newcomer has none).
import { totalLevel } from '@idle-clash/features';
import { and, eq } from 'drizzle-orm';
import type { Ctx } from '../context.ts';
import { hiscores } from '../db/schema.ts';
import { TOTAL } from './hiscores.ts';

export function totalLevelOf(ctx: Ctx, playerId: string): number {
  const row = ctx.db
    .select({ level: hiscores.level })
    .from(hiscores)
    .where(and(eq(hiscores.playerId, playerId), eq(hiscores.skill, TOTAL)))
    .get();
  if (row) return row.level;
  const saved = ctx.store.read(playerId, ctx.config.now());
  return saved ? totalLevel(saved.doc.state) : 0;
}
