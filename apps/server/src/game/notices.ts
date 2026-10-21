// The notices tray's store: each player's notable events and lane stops, as the kernel announced
// them, the newest 100 kept. The page reads them when it opens; live events add to them after.
import { isNotable, type GameEvent } from '@idle-clash/kernel';
import { and, desc, eq, lt } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { notices } from '../db/schema.ts';

export const NOTICES_KEPT = 100;

/** What reaches the tray: notable moments (not the Uncommon finds the log already holds, which come
 *  by the dozen), and lanes that stopped by themselves. */
export const isNotice = (e: GameEvent) =>
  (isNotable(e) && !(e.type === 'find' && e.rarity === 'uncommon' && !e.first)) ||
  (e.type === 'laneStopped' && e.reason.code !== 'stoppedByPlayer');

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
}
