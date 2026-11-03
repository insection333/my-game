// The Castles ladder on Hiscores (session 38): every lord's castle by its rating, which only rises with
// what is built, drilled and forged (castleEngine.bastionRating), so it cannot be bought by a raid or lost
// to one; ties to the castle raised first. Beside each, the castle's average level. Banned lords and
// players not yet listed are left out, as on every ladder; your own entry is pinned wherever it stands.
import type { HiscoreRow, Ladder } from '@idle-clash/contracts';
import { and, asc, desc, eq, gt, isNotNull, isNull, lt, ne, or, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { playerBastions as b, players } from '../db/schema.ts';
import { LADDER_ROWS } from './hiscores.ts';
import { readLook } from './look.ts';

export const CASTLES = 'castle';

const level = sql<number>`cast((${b.castleWallsLevel} + ${b.deepVaultLevel} + ${b.watchtowerLevel} + ${b.spyGuildLevel} + ${b.vanguardLevel} + ${b.outridersLevel} + ${b.siegeLevel}) / 7 as integer)`;

export function castlesLadder(db: BetterSQLite3Database, playerId: string): Ladder {
  const entries = (only?: string) =>
    db
      .select({
        name: players.name,
        level,
        rating: b.bastionRating,
        createdAt: b.createdAt,
        title: players.title,
        banner: players.banner,
        look: players.look,
      })
      .from(b)
      .innerJoin(players, eq(players.id, b.userId))
      .where(
        and(gt(b.bastionRating, 0), isNull(players.bannedAt), only ? eq(b.userId, only) : isNotNull(players.listedAt)),
      );
  const row = (
    r: {
      name: string;
      level: number;
      rating: number;
      title: string | null;
      banner: string | null;
      look: string | null;
    },
    rank: number,
  ): HiscoreRow => ({
    rank,
    name: r.name,
    level: r.level,
    xp: r.rating,
    milestones: 0,
    title: r.title,
    banner: r.banner,
    look: readLook(r.look),
  });
  const top = entries().orderBy(desc(b.bastionRating), asc(b.createdAt)).limit(LADDER_ROWS).all();
  const mine = entries(playerId).get();
  let you: HiscoreRow | null = null;
  if (mine) {
    const ahead = db
      .select({ n: sql<number>`count(*)` })
      .from(b)
      .innerJoin(players, eq(players.id, b.userId))
      .where(
        and(
          isNull(players.bannedAt),
          isNotNull(players.listedAt),
          ne(b.userId, playerId),
          or(gt(b.bastionRating, mine.rating), and(eq(b.bastionRating, mine.rating), lt(b.createdAt, mine.createdAt))),
        ),
      )
      .get();
    you = row(mine, (ahead?.n ?? 0) + 1);
  }
  return { skill: CASTLES, rows: top.map((r, i) => row(r, i + 1)), you };
}
