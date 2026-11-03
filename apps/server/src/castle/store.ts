// Castle Clash's tables: castles by player, the realm's war chest, and each castle's newest 20 reports.
// Every call runs on the one connection inside the caller's transaction (DESIGN.md section 3).
import { castleEngine } from '@idle-clash/features';
import { and, asc, desc, eq, gte, inArray, isNull, lte, ne, notInArray, sql } from 'drizzle-orm';
import type { Ctx } from '../context.ts';
import { bastionGlobalState, bastionLogs, playerBastions, players } from '../db/schema.ts';
import { tally } from './record.ts';
import { toCastle, toRow } from './rows.ts';

type Castle = castleEngine.Castle;

/** Reports kept per castle (the plan's ring buffer). */
export const LOGS_KEPT = 20;

export interface LogEntry {
  id: number;
  at: number;
  kind: string;
  data: Record<string, unknown>;
}

export class CastleStore {
  private readonly ctx: Pick<Ctx, 'db'>;
  constructor(ctx: Pick<Ctx, 'db'>) {
    this.ctx = ctx;
  }

  read(userId: string): Castle | null {
    const row = this.ctx.db.select().from(playerBastions).where(eq(playerBastions.userId, userId)).get();
    return row ? toCastle(row) : null;
  }

  /** Two castles, read in ascending player id: the plan's lock order. */
  readPair(a: string, b: string): Map<string, Castle> {
    const rows = this.ctx.db
      .select()
      .from(playerBastions)
      .where(inArray(playerBastions.userId, [a, b]))
      .orderBy(asc(playerBastions.userId))
      .all();
    return new Map(rows.map((r) => [r.userId, toCastle(r)]));
  }

  write(c: Castle): void {
    const row = toRow(c);
    this.ctx.db
      .insert(playerBastions)
      .values(row)
      .onConflictDoUpdate({ target: playerBastions.userId, set: row })
      .run();
  }

  /** The war chest. */
  chest(): number {
    return (
      this.ctx.db.select().from(bastionGlobalState).where(eq(bastionGlobalState.id, 1)).get()?.warChestReserveGold ?? 0
    );
  }

  /** Adds to (or, for a bounty, takes from) the chest, and counts gold destroyed. */
  ledger(toChest: number, destroyed: number): void {
    this.ctx.db
      .insert(bastionGlobalState)
      .values({ id: 1, warChestReserveGold: Math.max(0, toChest), goldDestroyed: Math.max(0, destroyed) })
      .onConflictDoUpdate({
        target: bastionGlobalState.id,
        set: {
          warChestReserveGold: sql`max(0, ${bastionGlobalState.warChestReserveGold} + ${toChest})`,
          goldDestroyed: sql`${bastionGlobalState.goldDestroyed} + ${Math.max(0, destroyed)}`,
        },
      })
      .run();
  }

  /** A burn: 95% destroyed, 5% to the chest. */
  burn(gold: number): void {
    if (gold <= 0) return;
    const { destroyed, toChest } = castleEngine.splitBurn(gold);
    this.ledger(toChest, destroyed);
  }

  /** Adds a report, keeping the castle's newest 20, and counts it towards the lord's war record. */
  log(userId: string, at: number, kind: string, data: Record<string, unknown>): void {
    this.ctx.db
      .insert(bastionLogs)
      .values({ userId, createdAt: at, kind, data: JSON.stringify(data) })
      .run();
    tally(this.ctx.db, userId, kind, data);
    const keep = this.ctx.db
      .select({ id: bastionLogs.id })
      .from(bastionLogs)
      .where(eq(bastionLogs.userId, userId))
      .orderBy(desc(bastionLogs.createdAt), desc(bastionLogs.id))
      .limit(LOGS_KEPT)
      .all()
      .map((r) => r.id);
    this.ctx.db
      .delete(bastionLogs)
      .where(and(eq(bastionLogs.userId, userId), notInArray(bastionLogs.id, keep)))
      .run();
  }

  logs(userId: string): LogEntry[] {
    return this.ctx.db
      .select()
      .from(bastionLogs)
      .where(eq(bastionLogs.userId, userId))
      .orderBy(desc(bastionLogs.createdAt), desc(bastionLogs.id))
      .limit(LOGS_KEPT)
      .all()
      .map((r) => {
        let data: Record<string, unknown> = {};
        try {
          const parsed: unknown = JSON.parse(r.data);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) data = parsed as Record<string, unknown>;
        } catch {
          /* a damaged report reads as empty */
        }
        return { id: r.id, at: r.createdAt, kind: r.kind, data };
      });
  }

  /** Unshielded, unbanned lords within a rating bracket, nearest first (at most 20 to choose from). */
  lordsNear(
    self: string,
    rating: number,
    bracket: { low: number; high: number },
    now: number,
  ): { id: string; name: string; rating: number }[] {
    const low = Math.floor(rating * bracket.low);
    const high = Math.ceil(rating * bracket.high);
    return this.ctx.db
      .select({ id: playerBastions.userId, name: players.name, rating: playerBastions.bastionRating })
      .from(playerBastions)
      .innerJoin(players, eq(players.id, playerBastions.userId))
      .where(
        and(
          gte(playerBastions.bastionRating, low),
          lte(playerBastions.bastionRating, high),
          lte(playerBastions.shieldUntilUtc, now),
          ne(playerBastions.userId, self),
          isNull(players.bannedAt),
        ),
      )
      .orderBy(sql`abs(${playerBastions.bastionRating} - ${rating})`)
      .limit(20)
      .all();
  }

  /** Names of players by id (absent for a departed or unknown one). */
  names(ids: string[]): Map<string, string> {
    const wanted = [...new Set(ids)].filter((id) => id && id !== 'departed' && !id.startsWith('merc:'));
    if (!wanted.length) return new Map();
    const rows = this.ctx.db
      .select({ id: players.id, name: players.name })
      .from(players)
      .where(inArray(players.id, wanted))
      .all();
    return new Map(rows.map((r) => [r.id, r.name]));
  }

  /** Whether a player is banned (a banned lord cannot be a target). */
  banned(id: string): boolean {
    return !!this.ctx.db.select({ b: players.bannedAt }).from(players).where(eq(players.id, id)).get()?.b;
  }
}
