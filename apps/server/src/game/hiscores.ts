// Hiscores: each player's level and XP in every skill and in total, kept as their save changes, and
// the ladders read from them: rank by level, then XP (the total level leads Total), ties to whoever
// got there first; banned players left out. Each row carries the player's title and banner (deeds).
import { levelFor } from '@idle-clash/content';
import { allSkills, goalsOf, kindlingData, shownHonours, totalLevel } from '@idle-clash/features';
import type { HiscoreRow, Ladder } from '@idle-clash/contracts';
import { xpOf, type GameEvent, type State } from '@idle-clash/kernel';
import { and, asc, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { hiscores, players } from '../db/schema.ts';
import { lookOf, readLook } from './look.ts';
import { climb } from './rank-ups.ts';
import { Ranks } from './ranks.ts';
import { isQuiet, isSeasonRow, seasonEntries } from './season-ladder.ts';
import { deepEntries, kindlingsEntries } from './deep-ladder.ts';

export const TOTAL = 'total';
export const LADDER_ROWS = 25;
/** A player joins the hiscores once one of their actions comes this long after their first: someone
 *  who looks for ten minutes and leaves is never listed. */
export const LISTED_AFTER_MS = 30 * 60_000;
/** Rivals (session 173): a player passed hears of it on a ladder they gained on within this time. */
export const CLIMBING_MS = 7 * 86_400_000;
/** The most players one write says it passed (the nearest). */
export const PASSED_AT_ONCE = 3;

interface Top {
  playerId: string;
  name: string;
  level: number;
  xp: number;
  milestones: number;
  reachedAt: number;
  title: string | null;
  banner: string | null;
  look: string | null;
}

/** Whether an entry stands above a row in the ladder's order (level, then XP; a tie to the earlier). */
const ahead = (e: { level: number; xp: number }, r: Top) => e.level > r.level || (e.level === r.level && e.xp >= r.xp);

interface Row {
  xp: number;
  milestones: number;
  reachedAt: number;
  /** The best band of places reached (rank-ups.ts); null until first placed. */
  bestBand: number | null;
}

export class Hiscores {
  /** Hears of a climb into a better band of places (session 49), to say it to the player. */
  onRankUp: (playerId: string, events: GameEvent[]) => void = () => undefined;
  /** Hears of a player passing a rival (session 173), to say it to the one passed. */
  onPassed: (playerId: string, events: GameEvent[]) => void = () => undefined;
  /** Each passing said, so one pair on one ladder is said once a day (session 173). */
  private said = new Map<string, number>();
  private db: BetterSQLite3Database;
  /** When each player's levels were last recorded (since the server started). */
  private heard = new Map<string, number>();
  /** The honours last written for each player, so an unchanged save writes nothing. */
  private shown = new Map<string, string>();
  /** Players known to be listed (a player once listed stays listed). */
  private listed = new Set<string>();
  /** Each player's rows as last written, read from the table once (session 37): a save read or written
   *  is compared with these, so an unchanged one asks nothing of the database. */
  private rows = new Map<string, Map<string, Row>>();
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
    const look = lookOf(honours);
    const key = `${honours.title ?? ''}|${honours.banner}|${look}`;
    if (this.shown.get(playerId) !== key) {
      this.db
        .update(players)
        .set({ title: honours.title, banner: honours.banner, look })
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
          .map((r) => [r.skill, { xp: r.xp, milestones: r.milestones, reachedAt: r.reachedAt, bestBand: r.bestBand }]),
      );
      this.rows.set(playerId, had);
    }
    // The season's ladder: the goals done since it opened (session 165).
    entries.push(...seasonEntries(at, state, had));
    // The Deep's ladder of the week (session 214).
    entries.push(...deepEntries(at, state));
    // Every Kindling across every skill (session 219).
    entries.push(...kindlingsEntries(skills.reduce((n, s) => n + kindlingData.kindlingsIn(xpOf(state, s)), 0)));
    const climbs: GameEvent[] = [];
    for (const e of entries) {
      const old = had.get(e.skill);
      if (old && old.xp === e.xp && old.milestones === e.milestones) continue;
      // What a season counts from is written even at nothing: a player new this season counts from 0.
      if (!old && e.xp === 0 && !isQuiet(e.skill)) continue;
      const reachedAt = old?.xp === e.xp ? old.reachedAt : at;
      this.db
        .insert(hiscores)
        .values({ playerId, ...e, reachedAt: at })
        .onConflictDoUpdate({
          target: [hiscores.playerId, hiscores.skill],
          set: { level: e.level, xp: e.xp, milestones: e.milestones, reachedAt },
        })
        .run();
      const row: Row = {
        xp: e.xp,
        milestones: e.milestones,
        reachedAt: old ? reachedAt : at,
        bestBand: old?.bestBand ?? null,
      };
      had.set(e.skill, row);
      if (isQuiet(e.skill)) continue;
      const standing = { playerId, level: e.level, xp: e.xp, reachedAt: row.reachedAt };
      const passed = this.isListed(playerId) ? this.standings.passes(e.skill, standing) : [];
      this.standings.set(e.skill, standing);
      if (passed.length) this.passing(playerId, e.skill, passed, at);
      if (this.isListed(playerId)) this.placed(playerId, e.skill, e.level, row, at, climbs);
      const top = this.tops.get(e.skill);
      if (
        top &&
        (top.length < LADDER_ROWS || top.some((r) => r.playerId === playerId) || ahead(e, top[top.length - 1]))
      )
        this.tops.delete(e.skill);
    }
    if (climbs.length) this.onRankUp(playerId, climbs);
  }

  /** Rivals (session 173): each player passed hears of it, on a ladder they climb (they gained on it in the
   *  last week), once a day for each who passes them there, three at most at once (a leap past many is
   *  said to the nearest three). */
  private passing(playerId: string, skill: string, passed: readonly string[], at: number): void {
    const name = this.db.select({ name: players.name }).from(players).where(eq(players.id, playerId)).get()?.name;
    if (!name) return;
    const day = new Date(at).toISOString().slice(0, 10);
    for (const other of passed.slice(-PASSED_AT_ONCE)) {
      const key = `${other}|${playerId}|${skill}|${day}`;
      if (this.said.has(key)) continue;
      const theirs = this.db
        .select({ reachedAt: hiscores.reachedAt, level: hiscores.level, xp: hiscores.xp })
        .from(hiscores)
        .where(and(eq(hiscores.playerId, other), eq(hiscores.skill, skill)))
        .get();
      if (!theirs || at - theirs.reachedAt > CLIMBING_MS) continue;
      this.said.set(key, at);
      const place = this.standings.rank(skill, theirs);
      this.onPassed(other, [{ type: 'passedBy', at, skill, foe: name, place }]);
    }
    // The day's record of what was said is let go as days pass.
    if (this.said.size > 10_000) for (const [k, t] of this.said) if (at - t > 86_400_000) this.said.delete(k);
  }

  /** Who stands either side of a listed player on a ladder (session 173). */
  near(skill: string, playerId: string): { above: HiscoreRow | null; below: HiscoreRow | null } | undefined {
    if (!this.isListed(playerId)) return undefined;
    const ids = this.standings.near(skill, playerId);
    const rowOf = (id: string | null): HiscoreRow | null => {
      if (!id) return null;
      const r = this.entries(skill, id).get();
      if (!r) return null;
      return {
        rank: this.standings.rank(skill, r),
        name: r.name,
        level: r.level,
        xp: r.xp,
        milestones: r.milestones,
        title: r.title,
        banner: r.banner,
        look: readLook(r.look),
      };
    };
    return { above: rowOf(ids.above), below: rowOf(ids.below) };
  }

  /** A listed player's row written: their place on that ladder, and a climb into a better band said. */
  private placed(playerId: string, skill: string, level: number, row: Row, at: number, climbs: GameEvent[]) {
    const place = this.standings.rank(skill, { level, xp: row.xp, reachedAt: row.reachedAt });
    const { keep, said } = climb(row.bestBand, place);
    if (keep !== row.bestBand) {
      row.bestBand = keep;
      this.db
        .update(hiscores)
        .set({ bestBand: keep })
        .where(and(eq(hiscores.playerId, playerId), eq(hiscores.skill, skill)))
        .run();
    }
    if (said) climbs.push({ type: 'rankUp', at, skill, place, band: keep });
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

  /** A listed player's places (session 54), for their profile card: Total, then their `best` best skills
   *  (the best place first; of equal places, the most XP). Nothing for a player not yet listed. */
  placesOf(playerId: string, best = 3): { skill: string; place: number }[] {
    if (!this.isListed(playerId)) return [];
    const rows = this.db.select().from(hiscores).where(eq(hiscores.playerId, playerId)).all();
    const places = rows
      .filter((r) => r.xp > 0 && !isSeasonRow(r.skill))
      .map((r) => ({ skill: r.skill, place: this.standings.rank(r.skill, r), xp: r.xp }));
    const total = places.filter((p) => p.skill === 'total');
    const skills = places.filter((p) => p.skill !== 'total').sort((a, b) => a.place - b.place || b.xp - a.xp);
    return [...total, ...skills.slice(0, best)].map(({ skill, place }) => ({ skill, place }));
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
        look: players.look,
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
      look: readLook(r.look),
    });
    const rows = top.map((r, i) => row(r, i + 1));
    const mine = this.entries(skill, playerId).get();
    if (!mine) return { skill, rows, you: null };
    const near = this.near(skill, playerId);
    const shown = top.findIndex((r) => r.playerId === playerId);
    const you = row(mine, shown >= 0 ? shown + 1 : this.standings.rank(skill, mine));
    return { skill, rows, you, ...(near ? { near } : {}) };
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
