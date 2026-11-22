// The realm's boss of the week on the server (session 174): the strikes each player lands on it, counted
// from their saves' own events as they are written (`realmFought` won, by the week it was fought in); the
// strikes the week needs, set at its first (four for each player who played the week before, eight at
// least); its fall, told at once to everyone who struck; how the week stands, written into each save before
// the engine runs (as the castle is); and the week's ladder of strikes for the hiscores.
import { readLook } from './look.ts';
import type { HiscoreRow, Ladder } from '@idle-clash/contracts';
import { REALM_LEAST, REALM_PER_PLAYER, realmBossIn, weekOf, type RealmMirror } from '@idle-clash/features';
import type { GameEvent, State } from '@idle-clash/kernel';
import { and, asc, desc, eq, gte, isNotNull, isNull, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { players, realmStrikes, realmWeeks, visits } from '../db/schema.ts';
import { LADDER_ROWS } from './hiscores.ts';

const DAY = 86_400_000;
export const REALM = 'realm';
const lastWeekOf = (week: string) => new Date(Date.parse(`${week}T00:00:00Z`) - 7 * DAY).toISOString().slice(0, 10);

export class Realm {
  /** Hears of the boss's fall, to tell each player who struck it. */
  onFell: (playerId: string, events: GameEvent[]) => void = () => undefined;
  private db: BetterSQLite3Database;
  /** The weeks' rows, totals and each player's strikes as last read (every request reads them; they change
   *  only by `heard`, which keeps them in step, and by an account deleted, which lets them go). */
  private weeks = new Map<string, { needed: number; fellAt: number | null }>();
  private totals = new Map<string, number>();
  private mines = new Map<string, number>();
  constructor(db: BetterSQLite3Database) {
    this.db = db;
  }

  /** The week's row: made at its first need, sized to the players who played the week before. */
  private weekRow(week: string) {
    const held = this.weeks.get(week);
    if (held) return held;
    const row = this.db.select().from(realmWeeks).where(eq(realmWeeks.week, week)).get();
    if (row) return this.keep(week, row);
    const from = lastWeekOf(week);
    const played = this.db
      .select({ n: sql<number>`count(distinct ${visits.playerId})` })
      .from(visits)
      .where(and(gte(visits.day, from), sql`${visits.day} < ${week}`))
      .get()!.n;
    const needed = Math.max(REALM_LEAST, REALM_PER_PLAYER * played);
    this.db.insert(realmWeeks).values({ week, needed, fellAt: null }).onConflictDoNothing().run();
    return this.keep(week, this.db.select().from(realmWeeks).where(eq(realmWeeks.week, week)).get()!);
  }

  private keep(week: string, row: { needed: number; fellAt: number | null }) {
    const held = { needed: row.needed, fellAt: row.fellAt };
    this.weeks.set(week, held);
    return held;
  }

  private total(week: string): number {
    const held = this.totals.get(week);
    if (held !== undefined) return held;
    const n =
      this.db
        .select({ n: sql<number>`coalesce(sum(${realmStrikes.strikes}), 0)` })
        .from(realmStrikes)
        .where(eq(realmStrikes.week, week))
        .get()?.n ?? 0;
    this.totals.set(week, n);
    return n;
  }

  private mine(week: string, playerId: string): number {
    const key = `${week}|${playerId}`;
    const held = this.mines.get(key);
    if (held !== undefined) return held;
    const n =
      this.db
        .select({ n: realmStrikes.strikes })
        .from(realmStrikes)
        .where(and(eq(realmStrikes.week, week), eq(realmStrikes.playerId, playerId)))
        .get()?.n ?? 0;
    if (this.mines.size > 50_000) this.mines.clear();
    this.mines.set(key, n);
    return n;
  }

  /** A save's events written: each strike counted in its week; the boss falls once the week has enough. */
  heard(playerId: string, events: readonly GameEvent[]): void {
    for (const e of events) {
      if (e.type !== 'realmFought' || !e.won) continue;
      const week = weekOf(e.at);
      const w = this.weekRow(week);
      const total = this.total(week);
      const had = this.mine(week, playerId);
      this.db
        .insert(realmStrikes)
        .values({ week, playerId, strikes: 1, firstAt: e.at })
        .onConflictDoUpdate({
          target: [realmStrikes.week, realmStrikes.playerId],
          set: { strikes: sql`${realmStrikes.strikes} + 1` },
        })
        .run();
      this.totals.set(week, total + 1);
      this.mines.set(`${week}|${playerId}`, had + 1);
      if (w.fellAt === null && total + 1 >= w.needed) {
        this.db.update(realmWeeks).set({ fellAt: e.at }).where(eq(realmWeeks.week, week)).run();
        w.fellAt = e.at;
        const boss = realmBossIn(week).id;
        const strikers = this.db.select().from(realmStrikes).where(eq(realmStrikes.week, week)).all();
        for (const s of strikers)
          this.onFell(s.playerId, [{ type: 'realmFell', at: e.at, boss, week, strikes: s.strikes }]);
      }
    }
  }

  /** How the realm's week stands for a player now. */
  standing(playerId: string, now: number, claimed: string | null): RealmMirror {
    const week = weekOf(now);
    const w = this.weekRow(week);
    const mine = this.mine(week, playerId);
    // A fallen boss they struck, this week or last, whose share they have not taken.
    const owedIn = [week, lastWeekOf(week)].find((wk) => {
      if (wk === claimed) return false;
      const row =
        wk === week
          ? w
          : (this.weeks.get(wk) ?? this.db.select().from(realmWeeks).where(eq(realmWeeks.week, wk)).get());
      return !!row?.fellAt && this.mine(wk, playerId) > 0;
    });
    return {
      week,
      needed: w.needed,
      strikes: this.total(week),
      mine,
      fell: w.fellAt !== null,
      owed: owedIn ? { week: owedIn, boss: realmBossIn(owedIn).id } : null,
    };
  }

  /** The save with the realm's week as it stands, before the engine runs. */
  mirror(playerId: string, state: State, now: number): State {
    const e = state.features.expeditions as { realm?: { claimed?: string | null } } | undefined;
    const realm = this.standing(playerId, now, e?.realm?.claimed ?? null);
    if (JSON.stringify(state.features.realm) === JSON.stringify(realm)) return state;
    return { ...state, features: { ...state.features, realm } };
  }

  /** The week's ladder of strikes: the most first, ties to whoever struck first. */
  ladder(playerId: string, now: number): Ladder {
    const week = weekOf(now);
    const entries = (only?: string) =>
      this.db
        .select({
          name: players.name,
          strikes: realmStrikes.strikes,
          firstAt: realmStrikes.firstAt,
          title: players.title,
          banner: players.banner,
          look: players.look,
        })
        .from(realmStrikes)
        .innerJoin(players, eq(players.id, realmStrikes.playerId))
        .where(
          and(
            eq(realmStrikes.week, week),
            isNull(players.bannedAt),
            only ? eq(realmStrikes.playerId, only) : isNotNull(players.listedAt),
          ),
        );
    const row = (
      r: { name: string; strikes: number; title: string | null; banner: string | null; look: string | null },
      rank: number,
    ): HiscoreRow => ({
      rank,
      name: r.name,
      level: 0,
      xp: r.strikes,
      milestones: 0,
      title: r.title,
      banner: r.banner,
      look: readLook(r.look),
    });
    const top = entries().orderBy(desc(realmStrikes.strikes), asc(realmStrikes.firstAt)).limit(LADDER_ROWS).all();
    const rows = top.map((r, i) => row(r, i + 1));
    const mine = entries(playerId).get();
    if (!mine) return { skill: REALM, rows, you: null };
    const above = this.db
      .select({ n: sql<number>`count(*)` })
      .from(realmStrikes)
      .innerJoin(players, eq(players.id, realmStrikes.playerId))
      .where(
        and(
          eq(realmStrikes.week, week),
          isNull(players.bannedAt),
          isNotNull(players.listedAt),
          sql`(${realmStrikes.strikes} > ${mine.strikes} or (${realmStrikes.strikes} = ${mine.strikes} and ${realmStrikes.firstAt} < ${mine.firstAt}))`,
        ),
      )
      .get()!.n;
    return { skill: REALM, rows, you: row(mine, above + 1) };
  }

  /** An account deleted: its strikes go (the week's count with them). */
  remove(playerId: string): void {
    this.db.delete(realmStrikes).where(eq(realmStrikes.playerId, playerId)).run();
    this.totals.clear();
    this.mines.clear();
  }
}
