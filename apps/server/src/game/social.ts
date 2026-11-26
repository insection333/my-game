// Cheers and gifts (session 254, the plan of 26 November, phase 5): warmth between friends without trade.
// A cheer is one press on a friend's card for something they did this week (a climb on a ladder, a legend
// taken, a strike on the realm's boss), a small moment for them; three a day, one a friend. A gift is a
// supply cache sent once a day, opened by the friend as a cache of their own (nothing leaves the giver),
// refused from an account under a week old and between accounts made in the same week, and at most three a
// day reach one player, so a crowd of new accounts cannot feed one. A block either way stops both.
import type { SocialState } from '@idle-clash/contracts';
import type { GameEvent, State } from '@idle-clash/kernel';
import { and, asc, eq, isNull, lt, or, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { cheers, gifts, mailBlocks, players } from '../db/schema.ts';

export const CHEERS_A_DAY = 3;
export const GIFTS_TAKEN_A_DAY = 3;
/** The gifts the save is told of at once (shared/gifts.ts holds the same). */
export const GIFTS_WAITING = 10;
const DAY = 86_400_000;
/** A giver's account must be a week old, and two accounts made within a week of each other cannot give. */
export const GIFT_AGE_MS = 7 * DAY;
/** What a cheer may be for: done within the week. */
const CHEER_WINDOW_MS = 7 * DAY;

const dayOf = (at: number) => new Date(at).toISOString().slice(0, 10);
export type Cheer = { occasion: 'rank' | 'legend' | 'strike'; detail: string; place: number };
type Told = (playerId: string, events: GameEvent[]) => void;

export class Social {
  private db: BetterSQLite3Database;
  private noticesOf: (playerId: string) => GameEvent[];
  /** Tells a player at once and keeps it with their notices (set by the app). */
  onTold: Told = () => {};
  constructor(db: BetterSQLite3Database, noticesOf: (playerId: string) => GameEvent[]) {
    this.db = db;
    this.noticesOf = noticesOf;
  }

  /** What a cheer for a player would be for now: the latest climb, legend taken or strike of the week. */
  occasion(playerId: string, now: number): Cheer | null {
    for (const e of this.noticesOf(playerId)) {
      if (now - e.at > CHEER_WINDOW_MS) break;
      if (e.type === 'rankUp') return { occasion: 'rank', detail: e.skill, place: e.place };
      if (e.type === 'castleLegend' && e.taken) return { occasion: 'legend', detail: e.legend, place: 0 };
      if (e.type === 'realmFought' && e.won) return { occasion: 'strike', detail: e.boss, place: 0 };
    }
    return null;
  }

  /** Whether either has blocked the other. */
  blocked(a: string, b: string): boolean {
    return !!this.db
      .select({ at: mailBlocks.at })
      .from(mailBlocks)
      .where(
        or(
          and(eq(mailBlocks.blockerId, a), eq(mailBlocks.blockedId, b)),
          and(eq(mailBlocks.blockerId, b), eq(mailBlocks.blockedId, a)),
        ),
      )
      .get();
  }

  cheerState(fromId: string, toId: string, now: number): SocialState {
    const today = this.db
      .select({ toId: cheers.toId })
      .from(cheers)
      .where(and(eq(cheers.fromId, fromId), eq(cheers.day, dayOf(now))))
      .all();
    if (today.some((c) => c.toId === toId)) return 'sent';
    return today.length >= CHEERS_A_DAY ? 'spent' : 'open';
  }

  giftState(from: { id: string; createdAt: number }, to: { id: string; createdAt: number }, now: number): SocialState {
    const day = dayOf(now);
    if (
      this.db
        .select({ id: gifts.id })
        .from(gifts)
        .where(and(eq(gifts.fromId, from.id), eq(gifts.day, day)))
        .get()
    )
      return 'given';
    if (now - from.createdAt < GIFT_AGE_MS) return 'young';
    if (Math.abs(from.createdAt - to.createdAt) < GIFT_AGE_MS) return 'sameWeek';
    const taken = this.db
      .select({ n: sql<number>`count(*)` })
      .from(gifts)
      .where(and(eq(gifts.toId, to.id), eq(gifts.day, day)))
      .get()!.n;
    return taken >= GIFTS_TAKEN_A_DAY || this.waitingOf(to.id).length >= GIFTS_WAITING ? 'full' : 'open';
  }

  /** A cheer sent: refused unless open and there is something to cheer. */
  cheer(from: { id: string; name: string }, toId: string, now: number): SocialState | 'nothing' {
    const state = this.cheerState(from.id, toId, now);
    if (state !== 'open') return state;
    const what = this.occasion(toId, now);
    if (!what) return 'nothing';
    this.db
      .insert(cheers)
      .values({ fromId: from.id, toId, at: now, day: dayOf(now) })
      .run();
    this.onTold(toId, [{ type: 'cheered', at: now, from: from.name, ...what }]);
    return 'open';
  }

  /** A gift sent: refused unless open. */
  gift(
    from: { id: string; name: string; createdAt: number },
    to: { id: string; createdAt: number },
    now: number,
  ): SocialState {
    const state = this.giftState(from, to, now);
    if (state !== 'open') return state;
    this.db
      .insert(gifts)
      .values({ fromId: from.id, toId: to.id, at: now, day: dayOf(now) })
      .run();
    this.onTold(to.id, [{ type: 'giftCame', at: now, from: from.name }]);
    return 'open';
  }

  /** The gifts waiting for a player, the oldest first, with the giver's name as it is now. */
  waitingOf(playerId: string): { id: number; from: string; at: number }[] {
    return this.db
      .select({ id: gifts.id, from: players.name, at: gifts.at })
      .from(gifts)
      .innerJoin(players, eq(players.id, gifts.fromId))
      .where(and(eq(gifts.toId, playerId), isNull(gifts.openedAt)))
      .orderBy(asc(gifts.id))
      .limit(GIFTS_WAITING)
      .all();
  }

  /** The save told which gifts wait (`features.gifts`), as the realm's week is. */
  mirror(playerId: string, state: State): State {
    const waiting = this.waitingOf(playerId);
    const had = Object.hasOwn(state.features, 'gifts');
    if (!waiting.length && !had) return state;
    const told = { waiting };
    if (had && JSON.stringify(state.features.gifts) === JSON.stringify(told)) return state;
    return { ...state, features: { ...state.features, gifts: told } };
  }

  /** A save's events written: each gift it opened marked, so it is told no more. */
  heard(playerId: string, events: readonly GameEvent[]): void {
    for (const e of events)
      if (e.type === 'giftOpened')
        this.db
          .update(gifts)
          .set({ openedAt: e.at })
          .where(and(eq(gifts.id, e.gift), eq(gifts.toId, playerId)))
          .run();
  }

  /** Housekeeping: cheers kept two days, gifts a month. */
  sweep(now: number): void {
    this.db
      .delete(cheers)
      .where(lt(cheers.at, now - 2 * DAY))
      .run();
    this.db
      .delete(gifts)
      .where(lt(gifts.at, now - 30 * DAY))
      .run();
  }

  /** An account deleted: its cheers and gifts, sent and waiting, go. */
  remove(playerId: string): void {
    this.db
      .delete(cheers)
      .where(or(eq(cheers.fromId, playerId), eq(cheers.toId, playerId)))
      .run();
    this.db
      .delete(gifts)
      .where(or(eq(gifts.fromId, playerId), eq(gifts.toId, playerId)))
      .run();
  }
}
