// Sessions: a random 32-byte token in an HttpOnly cookie; only its SHA-256 is stored. A session
// lasts 30 days from its last use.
import { and, eq, gt, lt } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { createHash, randomBytes } from 'node:crypto';
import { sessions } from '../db/schema.ts';

export const SESSION_COOKIE = 'ic_session';
export const SESSION_DAYS = 30;
const DAY = 24 * 3600_000;

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');

export class Sessions {
  private db: BetterSQLite3Database;
  constructor(db: BetterSQLite3Database) {
    this.db = db;
  }

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
