// The notices tray's store: each player's notable events and lane stops, as the kernel announced
// them, the newest 100 kept. The page reads them when it opens; live events add to them after.
import { isQuietStop } from '@idle-clash/content';
import { isNotable, type GameEvent } from '@idle-clash/kernel';
import { and, desc, eq, lt, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { notices } from '../db/schema.ts';

export const NOTICES_KEPT = 100;

/** What reaches the tray: notable moments (not the Uncommon finds the log already holds, which come
 *  by the dozen, nor a work raised, a press its moment answers with no line in the tray: session 76),
 *  and lanes that stopped by themselves. */
export const isNotice = (e: GameEvent) =>
  (isNotable(e) && !(e.type === 'find' && e.rarity === 'uncommon' && !e.first) && e.type !== 'workRaised') ||
  (e.type === 'laneStopped' && !isQuietStop(e.reason.code));

export class Notices {
  private db: BetterSQLite3Database;
  constructor(db: BetterSQLite3Database) {
    this.db = db;
  }

  add(playerId: string, events: readonly GameEvent[]): void {
    const kept = events.filter(isNotice);
    if (!kept.length) return;
    for (const e of kept)
      this.db
        .insert(notices)
        .values({ playerId, at: e.at, data: JSON.stringify(e) })
        .run();
    // Only the newest are kept: anything older than the 100th goes.
    const edge = this.db
      .select({ id: notices.id })
      .from(notices)
      .where(eq(notices.playerId, playerId))
      .orderBy(desc(notices.id))
      .limit(1)
      .offset(NOTICES_KEPT - 1)
      .get();
    if (edge)
      this.db
        .delete(notices)
        .where(and(eq(notices.playerId, playerId), lt(notices.id, edge.id)))
        .run();
  }

  /** Newest first. */
  list(playerId: string): GameEvent[] {
    return this.db
      .select()
      .from(notices)
      .where(eq(notices.playerId, playerId))
      .orderBy(desc(notices.id))
      .limit(NOTICES_KEPT)
      .all()
      .map((r) => JSON.parse(r.data) as GameEvent);
  }

  remove(playerId: string): void {
    this.db.delete(notices).where(eq(notices.playerId, playerId)).run();
  }

  /** A departed lord's name, taken out of every other lord's Castle Clash notice that named them (the
   *  notice then reads "a lord no longer of the realm"). */
  forgetFoe(name: string): void {
    const rows = this.db
      .select()
      .from(notices)
      .where(sql`instr(${notices.data}, ${JSON.stringify(name)}) > 0`)
      .all();
    for (const r of rows) {
      const e = JSON.parse(r.data) as Record<string, unknown>;
      if (e.foe !== name) continue;
      this.db
        .update(notices)
        .set({ data: JSON.stringify({ ...e, foe: '' }) })
        .where(eq(notices.id, r.id))
        .run();
    }
  }
}
