// A lord's war record (session 44): each report written counts once towards it, by its kind and how it
// went, so the profile card can show a lifetime's sieges, defences, strongholds and spies though reports
// keep only the newest 20. Fortresses and routs are already counted on the castle itself.
import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { castleRecords } from '../db/schema.ts';

type Column = Exclude<keyof typeof castleRecords.$inferSelect, 'userId'>;

/** Which count a report adds to, if any. */
export function tallyOf(kind: string, data: Record<string, unknown>): Column | null {
  const held = data.outcome === 'repelled';
  switch (kind) {
    case 'siegeOut':
      return held ? 'siegesLost' : 'siegesWon';
    case 'siegeIn':
      return held ? 'defencesHeld' : 'defencesLost';
    case 'mercenary':
      return held ? 'strongholdsHeld' : 'strongholdsTaken';
    case 'spyOut':
      return data.success === true ? 'spiesDone' : 'spiesCaught';
    case 'spyIn':
      return 'spiesStopped';
    default:
      return null;
  }
}

export function tally(db: BetterSQLite3Database, userId: string, kind: string, data: Record<string, unknown>): void {
  const column = tallyOf(kind, data);
  if (!column) return;
  db.insert(castleRecords)
    .values({ userId, [column]: 1 })
    .onConflictDoUpdate({ target: castleRecords.userId, set: { [column]: sql`${castleRecords[column]} + 1` } })
    .run();
}

export type WarRecord = Omit<typeof castleRecords.$inferSelect, 'userId'>;

export function recordOf(db: BetterSQLite3Database, userId: string): WarRecord | null {
  const row = db.select().from(castleRecords).where(eq(castleRecords.userId, userId)).get();
  if (!row) return null;
  const { userId: _, ...rest } = row;
  return rest;
}
