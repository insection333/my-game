// Sessions: a random 32-byte token in an HttpOnly cookie; only its SHA-256 is stored. A session
// lasts 30 days from its last use.
import { and, desc, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { createHash, randomBytes } from 'node:crypto';
import { sessions } from '../db/schema.ts';

export const SESSION_COOKIE = 'ic_session';
export const SESSION_DAYS = 30;
/** Browsers a player may stay signed in on at once. */
export const SESSIONS_PER_PLAYER = 20;
const DAY = 24 * 3600_000;

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');

export class Sessions {
  private db: BetterSQLite3Database;
  constructor(db: BetterSQLite3Database) {
    this.db = db;
  }

  /** A new session; past the limit, the player's least recently used sessions end. */
  create(playerId: string, now: number): string {
    const token = newToken();
    this.db
      .insert(sessions)
      .values({
        tokenHash: tokenHash(token),
        playerId,
        createdAt: now,
        expiresAt: now + SESSION_DAYS * DAY,
        lastSeenAt: now,
      })
      .run();
    // The newest first (rowid breaks ties), and only the first SESSIONS_PER_PLAYER kept.
    const old = this.db
      .select({ tokenHash: sessions.tokenHash })
      .from(sessions)
      .where(eq(sessions.playerId, playerId))
      .orderBy(desc(sessions.lastSeenAt), desc(sql`rowid`))
      .limit(1000)
      .offset(SESSIONS_PER_PLAYER)
      .all();
    if (old.length)
      this.db
        .delete(sessions)
        .where(
          inArray(
            sessions.tokenHash,
            old.map((o) => o.tokenHash),
          ),
        )
        .run();
    return token;
  }

  /** The player a token belongs to, renewing the session if it was last used over a day ago. */
  find(token: string, now: number): string | null {
    const row = this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.tokenHash, tokenHash(token)), gt(sessions.expiresAt, now)))
      .get();
    if (!row) return null;
    if (now - row.lastSeenAt > DAY) {
      this.db
        .update(sessions)
        .set({ lastSeenAt: now, expiresAt: now + SESSION_DAYS * DAY })
        .where(eq(sessions.tokenHash, row.tokenHash))
        .run();
    }
    return row.playerId;
  }

  end(token: string): void {
    this.db
      .delete(sessions)
      .where(eq(sessions.tokenHash, tokenHash(token)))
      .run();
  }

  endAll(playerId: string): void {
    this.db.delete(sessions).where(eq(sessions.playerId, playerId)).run();
  }

  sweep(now: number): void {
    this.db.delete(sessions).where(lt(sessions.expiresAt, now)).run();
  }
}
