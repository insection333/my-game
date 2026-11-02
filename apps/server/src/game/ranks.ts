// Each ladder's order, held in memory (session 37), so a player's rank is found by halving rather than
// by counting everyone above them in the table: with twenty thousand players a hiscores page cost a
// fifth of a second of the server's one thread. A ladder is read whole from the table the first time it
// is asked for, then kept in step with every row written, every player listed and every account
// deleted; a ban or its lifting lets every ladder go, to be read afresh.
import { and, eq, gt, isNotNull, isNull } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { hiscores, players } from '../db/schema.ts';

export interface Standing {
  playerId: string;
  level: number;
  xp: number;
  reachedAt: number;
}

/** Whether `a` stands strictly above `b`: a higher level, then more XP, then reached first. */
const above = (a: Omit<Standing, 'playerId'>, b: Omit<Standing, 'playerId'>) =>
  a.level !== b.level ? a.level > b.level : a.xp !== b.xp ? a.xp > b.xp : a.reachedAt < b.reachedAt;

/** The ladder's order, with ties of everything broken by player id so each entry has one place. */
const order = (a: Standing, b: Standing) =>
  above(a, b) ? -1 : above(b, a) ? 1 : a.playerId < b.playerId ? -1 : a.playerId > b.playerId ? 1 : 0;

/** The first place in `list` whose entry `before` does not put ahead of the one sought. */
function place(list: readonly Standing[], before: (s: Standing) => boolean): number {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (before(list[mid])) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

interface Held {
  list: Standing[];
  by: Map<string, Standing>;
}

export class Ranks {
  private db: BetterSQLite3Database;
  private ladders = new Map<string, Held>();
  /** Whether each player asked about is on the ladders at all (listed and not banned). */
  private members = new Map<string, boolean>();
  constructor(db: BetterSQLite3Database) {
    this.db = db;
  }

  private held(skill: string): Held {
    let h = this.ladders.get(skill);
    if (h) return h;
    const list = this.db
      .select({
        playerId: hiscores.playerId,
        level: hiscores.level,
        xp: hiscores.xp,
        reachedAt: hiscores.reachedAt,
      })
      .from(hiscores)
      .innerJoin(players, eq(players.id, hiscores.playerId))
      .where(and(eq(hiscores.skill, skill), gt(hiscores.xp, 0), isNull(players.bannedAt), isNotNull(players.listedAt)))
      .all()
      .sort(order);
    h = { list, by: new Map(list.map((s) => [s.playerId, s])) };
    this.ladders.set(skill, h);
    return h;
  }

  private member(playerId: string): boolean {
    let m = this.members.get(playerId);
    if (m === undefined) {
      const row = this.db
        .select({ listedAt: players.listedAt, bannedAt: players.bannedAt })
        .from(players)
        .where(eq(players.id, playerId))
        .get();
      m = !!row && row.listedAt !== null && row.bannedAt === null;
      this.members.set(playerId, m);
    }
    return m;
  }

  /** A player's rank with this entry: one more than everyone on the ladder strictly above it. */
  rank(skill: string, mine: Omit<Standing, 'playerId'>): number {
    return place(this.held(skill).list, (s) => above(s, mine)) + 1;
  }

  /** A row was written: the player moves to their new place on that ladder, if it is held. */
  set(skill: string, s: Standing): void {
    const h = this.ladders.get(skill);
    if (!h || s.xp <= 0 || !this.member(s.playerId)) return;
    const old = h.by.get(s.playerId);
    if (old)
      h.list.splice(
        place(h.list, (x) => order(x, old) < 0),
        1,
      );
    h.list.splice(
      place(h.list, (x) => order(x, s) < 0),
      0,
      s,
    );
    h.by.set(s.playerId, s);
  }

  /** A player was listed: their rows join the ladders held. */
  joined(playerId: string): void {
    this.members.set(playerId, true);
    if (!this.ladders.size) return;
    const rows = this.db.select().from(hiscores).where(eq(hiscores.playerId, playerId)).all();
    for (const r of rows) this.set(r.skill, { playerId, level: r.level, xp: r.xp, reachedAt: r.reachedAt });
  }

  /** A player's account went: they leave every ladder held. */
  drop(playerId: string): void {
    this.members.delete(playerId);
    for (const h of this.ladders.values()) {
      const old = h.by.get(playerId);
      if (!old) continue;
      h.list.splice(
        place(h.list, (x) => order(x, old) < 0),
        1,
      );
      h.by.delete(playerId);
    }
  }

  /** Who is on the ladders changed in some other way: every ladder is read afresh when next asked for. */
  forget(): void {
    this.ladders.clear();
    this.members.clear();
  }
}
