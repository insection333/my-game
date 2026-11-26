// The realm's work of the season on the server (session 218): each player's gifts counted from their saves'
// own events as they are written (`realmGiven`, by the season given in); the worth the work asks, set at its
// first gift (a share for each player who gave the season before, the least for a realm of one); each stage
// raised, told at once to everyone who has given; and how the work stands, written into each save before the
// engine runs (as the realm's boss is), with the thanks for the last work finished with the player's part.
import { REALM_WORK, realmWorkIn, seasonAt, type RealmWorkMirror } from '@idle-clash/features';
import type { GameEvent, State } from '@idle-clash/kernel';
import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { players, realmWorkGifts, realmWorkSeasons } from '../db/schema.ts';

/** Names said in a work's thanks before "and N more". */
const NAMED = 5;

export class RealmWorks {
  /** Hears of a stage raised, to tell each who has given. */
  onStage: (playerId: string, events: GameEvent[]) => void = () => undefined;
  private db: BetterSQLite3Database;
  constructor(db: BetterSQLite3Database) {
    this.db = db;
  }

  private seasonRow(season: number) {
    const row = this.db.select().from(realmWorkSeasons).where(eq(realmWorkSeasons.season, season)).get();
    if (row) return row;
    const givers = this.db
      .select({ n: sql<number>`count(*)` })
      .from(realmWorkGifts)
      .where(eq(realmWorkGifts.season, season - 1))
      .get()!.n;
    const needed = Math.max(REALM_WORK.LEAST, REALM_WORK.PER_GIVER * givers);
    this.db.insert(realmWorkSeasons).values({ season, needed, doneAt: null }).onConflictDoNothing().run();
    return this.db.select().from(realmWorkSeasons).where(eq(realmWorkSeasons.season, season)).get()!;
  }

  private given(season: number): number {
    return (
      this.db
        .select({ n: sql<number>`coalesce(sum(${realmWorkGifts.worth}), 0)` })
        .from(realmWorkGifts)
        .where(eq(realmWorkGifts.season, season))
        .get()?.n ?? 0
    );
  }

  private givers(season: number): string[] {
    return this.db
      .select({ id: realmWorkGifts.playerId })
      .from(realmWorkGifts)
      .where(eq(realmWorkGifts.season, season))
      .all()
      .map((r) => r.id);
  }

  /** A save's events written: each gift counted; each stage the gifts raise told to every giver. */
  heard(playerId: string, events: readonly GameEvent[]): void {
    for (const e of events) {
      if (e.type !== 'realmGiven' || e.worth <= 0) continue;
      const row = this.seasonRow(e.season);
      if (row.doneAt !== null) continue;
      const before = this.given(e.season);
      this.db
        .insert(realmWorkGifts)
        .values({ season: e.season, playerId, worth: e.worth, firstAt: e.at })
        .onConflictDoUpdate({
          target: [realmWorkGifts.season, realmWorkGifts.playerId],
          set: { worth: sql`${realmWorkGifts.worth} + ${e.worth}` },
        })
        .run();
      const after = before + e.worth;
      const stage = (g: number) => Math.min(REALM_WORK.STAGES, Math.floor((g * REALM_WORK.STAGES) / row.needed));
      if (after >= row.needed)
        this.db.update(realmWorkSeasons).set({ doneAt: e.at }).where(eq(realmWorkSeasons.season, e.season)).run();
      for (let s = stage(before) + 1; s <= stage(after); s++)
        for (const giver of this.givers(e.season))
          this.onStage(giver, [
            { type: 'realmWorkStage', at: e.at, season: e.season, work: realmWorkIn(e.season), stage: s },
          ]);
    }
  }

  /** How the season's work stands for a player now. */
  standing(playerId: string, now: number): RealmWorkMirror | null {
    const season = seasonAt(now);
    if (!season) return null;
    const row = this.seasonRow(season.number);
    const gifts = this.db.select().from(realmWorkGifts).where(eq(realmWorkGifts.season, season.number)).all();
    const mine = gifts.find((g) => g.playerId === playerId)?.worth ?? 0;
    // Works finished with this player's part, and the last of them, thanked by those who raised it.
    const done = this.db
      .select({ season: realmWorkSeasons.season })
      .from(realmWorkSeasons)
      .innerJoin(realmWorkGifts, eq(realmWorkGifts.season, realmWorkSeasons.season))
      .where(and(isNotNull(realmWorkSeasons.doneAt), eq(realmWorkGifts.playerId, playerId)))
      .orderBy(desc(realmWorkSeasons.season))
      .all();
    let thanks: RealmWorkMirror['thanks'] = null;
    if (done.length) {
      const last = done[0].season;
      const raisers = this.db
        .select({ name: players.name })
        .from(realmWorkGifts)
        .innerJoin(players, eq(players.id, realmWorkGifts.playerId))
        // A banned raiser is not named (session 274): a ban is often for a name that gave offence.
        .where(and(eq(realmWorkGifts.season, last), isNull(players.bannedAt)))
        .orderBy(realmWorkGifts.firstAt)
        .all()
        .map((r) => r.name);
      thanks = {
        season: last,
        work: realmWorkIn(last),
        names: raisers.slice(0, NAMED),
        more: Math.max(0, raisers.length - NAMED),
      };
    }
    return {
      season: season.number,
      work: realmWorkIn(season.number),
      needed: row.needed,
      given: Math.min(
        row.needed,
        gifts.reduce((n, g) => n + g.worth, 0),
      ),
      mine,
      givers: gifts.length,
      finished: done.length,
      thanks,
    };
  }

  /** The save with the season's work as it stands, before the engine runs. */
  mirror(playerId: string, state: State, now: number): State {
    const work = this.standing(playerId, now);
    if (JSON.stringify(state.features['realm-work'] ?? null) === JSON.stringify(work)) return state;
    // A save's part names are kebab-case; none when there is no season.
    const { 'realm-work': _old, ...rest } = state.features;
    return { ...state, features: work ? { ...rest, 'realm-work': work } : rest };
  }

  /** An account deleted: its gifts go (a work it helped finish stays finished). */
  remove(playerId: string): void {
    this.db.delete(realmWorkGifts).where(eq(realmWorkGifts.playerId, playerId)).run();
  }
}
