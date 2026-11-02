// Hiscores: each player's level and XP in every skill and in total, kept as their save changes, and
// the ladders read from them: rank by level, then XP (the total level leads Total), ties to whoever
// got there first; banned players left out. Each row carries the player's title and banner (deeds).
import { levelFor } from '@idle-clash/content';
import { allSkills, goalsOf, shownHonours, totalLevel } from '@idle-clash/features';
import type { HiscoreRow, Ladder } from '@idle-clash/contracts';
import { xpOf, type State } from '@idle-clash/kernel';
import { and, asc, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { hiscores, players } from '../db/schema.ts';
import { Ranks } from './ranks.ts';

export const TOTAL = 'total';
export const LADDER_ROWS = 25;
/** A player joins the hiscores once one of their actions comes this long after their first: someone
 *  who looks for ten minutes and leaves is never listed. */
export const LISTED_AFTER_MS = 30 * 60_000;

interface Top {
  playerId: string;
  name: string;
  level: number;
  xp: number;
  milestones: number;
  reachedAt: number;
  title: string | null;
  banner: string | null;
}

/** Whether an entry stands above a row in the ladder's order (level, then XP; a tie to the earlier). */
const ahead = (e: { level: number; xp: number }, r: Top) => e.level > r.level || (e.level === r.level && e.xp >= r.xp);

export class Hiscores {
  private db: BetterSQLite3Database;
  /** When each player's levels were last recorded (since the server started). */
  private heard = new Map<string, number>();
  /** The honours last written for each player, so an unchanged save writes nothing. */
  private shown = new Map<string, string>();
  /** Players known to be listed (a player once listed stays listed). */
  private listed = new Set<string>();
  /** Each player's rows as last written, read from the table once (session 37): a save read or written
   *  is compared with these, so an unchanged one asks nothing of the database. */
  private rows = new Map<string, Map<string, { xp: number; milestones: number; reachedAt: number }>>();
  /** Each ladder's top rows as last read (session 37), kept until a write could change them: a row
   *  written that would place among them, a name, honours, listing or ban changed (`forget`). */
  private tops = new Map<string, Top[]>();
  /** Each ladder's order, for a player's rank below the top rows. */
  private standings: Ranks;
  constructor(db: BetterSQLite3Database) {
    this.db = db;
    this.standings = new Ranks(db);
  }

  /** When a player's levels were last recorded; 0 if not since the server started. */
  heardAt(playerId: string): number {
    return this.heard.get(playerId) ?? 0;
  }

  /** Records a save's levels: each skill, and the total (total level, all XP, milestones claimed). */
  update(playerId: string, state: State, at: number): void {
    this.heard.set(playerId, at);
    const honours = shownHonours(state);
    const key = `${honours.title ?? ''}|${honours.banner}`;
    if (this.shown.get(playerId) !== key) {
      this.db
        .update(players)
        .set({ title: honours.title, banner: honours.banner })
        .where(eq(players.id, playerId))
        .run();
      this.shown.set(playerId, key);
      this.tops.clear();
    }
    const skills = allSkills();
    const entries = [
      ...skills.map((s) => ({
        skill: s,
        xp: Math.floor(xpOf(state, s)),
        level: levelFor(xpOf(state, s)),
        milestones: 0,
      })),
      {
        skill: TOTAL,
        xp: skills.reduce((n, s) => n + Math.floor(xpOf(state, s)), 0),
        level: totalLevel(state),
        milestones: goalsOf(state).milestones.length,
      },
    ];
    let had = this.rows.get(playerId);
    if (!had) {
      had = new Map(
        this.db
          .select()
          .from(hiscores)
          .where(eq(hiscores.playerId, playerId))
          .all()
          .map((r) => [r.skill, { xp: r.xp, milestones: r.milestones, reachedAt: r.reachedAt }]),
      );
      this.rows.set(playerId, had);
    }
    for (const e of entries) {
      const old = had.get(e.skill);
      if (old && old.xp === e.xp && old.milestones === e.milestones) continue;
      if (!old && e.xp === 0) continue;
      const reachedAt = old?.xp === e.xp ? old.reachedAt : at;
      this.db
        .insert(hiscores)
        .values({ playerId, ...e, reachedAt: at })
        .onConflictDoUpdate({
          target: [hiscores.playerId, hiscores.skill],
          set: { level: e.level, xp: e.xp, milestones: e.milestones, reachedAt },
        })
        .run();
      had.set(e.skill, { xp: e.xp, milestones: e.milestones, reachedAt: old ? reachedAt : at });
      this.standings.set(e.skill, { playerId, level: e.level, xp: e.xp, reachedAt: old ? reachedAt : at });
      const top = this.tops.get(e.skill);
      if (
        top &&
        (top.length < LADDER_ROWS || top.some((r) => r.playerId === playerId) || ahead(e, top[top.length - 1]))
      )
        this.tops.delete(e.skill);
    }
  }

  /** Notes a player's action (a command or a feature route): their first, and once one comes half an
   *  hour or more after it, they are listed. */
  acted(playerId: string, at: number): void {
    if (this.listed.has(playerId)) return;
    const row = this.db
      .select({ firstActAt: players.firstActAt, listedAt: players.listedAt })
      .from(players)
      .where(eq(players.id, playerId))
      .get();
    if (!row) return;
    if (row.listedAt !== null) return void this.listed.add(playerId);
    if (row.firstActAt === null) {
      this.db.update(players).set({ firstActAt: at }).where(eq(players.id, playerId)).run();
    } else if (at - row.firstActAt >= LISTED_AFTER_MS) {
      this.db.update(players).set({ listedAt: at }).where(eq(players.id, playerId)).run();
      this.listed.add(playerId);
      this.tops.clear();
      this.standings.joined(playerId);
    }
  }

  /** Whether other players see this player on the hiscores. */
  isListed(playerId: string): boolean {
    if (this.listed.has(playerId)) return true;
    const row = this.db.select({ at: players.listedAt }).from(players).where(eq(players.id, playerId)).get();
    if (!row || row.at === null) return false;
    this.listed.add(playerId);
    return true;
  }

  /** Lets go of every ladder held: a player was renamed, banned or let back. */
  forget(): void {
    this.tops.clear();
    this.standings.forget();
  }

  /** A ladder's entries (one player's, with `only`, listed or not): XP above nothing, banned players
   *  and players not yet listed left out. */
  private entries(skill: string, only?: string) {
    return this.db
      .select({
        playerId: hiscores.playerId,
        name: players.name,
        level: hiscores.level,
        xp: hiscores.xp,
        milestones: hiscores.milestones,
        reachedAt: hiscores.reachedAt,
        title: players.title,
        banner: players.banner,
      })
      .from(hiscores)
      .innerJoin(players, eq(players.id, hiscores.playerId))
      .where(
        and(
          eq(hiscores.skill, skill),
          // Unary plus: the XP test is applied row by row, so the ladder is read in order (hiscores_rank).
          sql`+${hiscores.xp} > 0`,
          isNull(players.bannedAt),
          only ? eq(hiscores.playerId, only) : isNotNull(players.listedAt),
        ),
      );
  }

  ladder(skill: string, playerId: string): Ladder {
    let top = this.tops.get(skill);
    if (!top) {
      top = this.entries(skill)
        .orderBy(desc(hiscores.level), desc(hiscores.xp), asc(hiscores.reachedAt))
        .limit(LADDER_ROWS)
        .all();
      this.tops.set(skill, top);
    }
    const row = (r: Top, rank: number): HiscoreRow => ({
      rank,
      name: r.name,
      level: r.level,
      xp: r.xp,
      milestones: r.milestones,
      title: r.title,
      banner: r.banner,
    });
    const rows = top.map((r, i) => row(r, i + 1));
    const mine = this.entries(skill, playerId).get();
    if (!mine) return { skill, rows, you: null };
    const shown = top.findIndex((r) => r.playerId === playerId);
    if (shown >= 0) return { skill, rows, you: row(mine, shown + 1) };
    return { skill, rows, you: row(mine, this.standings.rank(skill, mine)) };
  }

  remove(playerId: string): void {
    this.heard.delete(playerId);
    this.listed.delete(playerId);
    this.shown.delete(playerId);
    this.rows.delete(playerId);
    this.tops.clear();
    this.standings.drop(playerId);
    this.db.delete(hiscores).where(eq(hiscores.playerId, playerId)).run();
  }
}
