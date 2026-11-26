// Notices while away (session 171): a player who switched them on hears, in their browser, of what asks
// for them while they are away: a lane that stopped with nothing to set it going again, the lanes about
// to rest at the away cap, a siege that breached their walls. Never while a page of the game is open,
// never from 22:00 to 08:00 in their own clock (held to the morning), three a day at most, each one
// leading to where the remedy is.
import { fmt, t } from '@idle-clash/content';
import { recap } from '@idle-clash/features';
import type { Engine, GameEvent, State } from '@idle-clash/kernel';
import { and, asc, eq, inArray, lte, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { pushDue, pushSent, pushSubs } from '../db/schema.ts';
import { isQuiet, localDay, localTime, quietEnds } from './clock.ts';
import { foresee } from './foresee.ts';
import type { Sender, Subscription } from './send.ts';

/** The most notices a player is sent in a day of their own clock. */
export const PUSH_A_DAY = 3;
/** The most browsers a player's notices go to; a new one past this replaces the oldest. */
export const PUSH_BROWSERS = 5;
/** How long after the last page closes the absence is foreseen: a reload is not leaving. */
export const LEFT_AFTER_MS = 60_000;

type Due = { kind: 'stop' | 'rest' | 'siege'; at: number; data: unknown };

export interface PushDeps {
  db: BetterSQLite3Database;
  engine: Engine;
  now: () => number;
  /** A player's save as it stands, with their castle's edict, or null. */
  stateOf: (playerId: string, at: number) => State | null;
  online: (playerId: string) => boolean;
}

export class Push {
  private left = new Map<string, number>();
  sender: Sender;
  private deps: PushDeps;
  constructor(deps: PushDeps, sender: Sender) {
    this.deps = deps;
    this.sender = sender;
  }

  subscribe(playerId: string, sub: Subscription, tz: string): void {
    const { db } = this.deps;
    db.delete(pushSubs).where(eq(pushSubs.endpoint, sub.endpoint)).run();
    db.insert(pushSubs)
      .values({
        playerId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        tz,
        createdAt: this.deps.now(),
      })
      .run();
    const mine = db.select().from(pushSubs).where(eq(pushSubs.playerId, playerId)).orderBy(asc(pushSubs.id)).all();
    for (const old of mine.slice(0, Math.max(0, mine.length - PUSH_BROWSERS)))
      db.delete(pushSubs).where(eq(pushSubs.id, old.id)).run();
  }

  unsubscribe(playerId: string, endpoint: string): void {
    this.deps.db
      .delete(pushSubs)
      .where(and(eq(pushSubs.playerId, playerId), eq(pushSubs.endpoint, endpoint)))
      .run();
  }

  private subs(playerId: string) {
    return this.deps.db.select().from(pushSubs).where(eq(pushSubs.playerId, playerId)).all();
  }

  /** The player opened a page: nothing waits for them any more. */
  back(playerId: string): void {
    this.left.delete(playerId);
    this.deps.db.delete(pushDue).where(eq(pushDue.playerId, playerId)).run();
  }

  /** The player's last page closed: their absence is foreseen a minute later, unless they come back. */
  gone(playerId: string): void {
    if (this.subs(playerId).length) this.left.set(playerId, this.deps.now());
  }

  /** Something asks for an away player at once (a siege that breached their walls). */
  now(playerId: string, event: GameEvent): void {
    if (this.deps.online(playerId) || !this.subs(playerId).length) return;
    this.queue(playerId, [{ kind: 'siege', at: this.deps.now(), data: event }]);
  }

  private queue(playerId: string, due: Due[]): void {
    for (const d of due)
      this.deps.db
        .insert(pushDue)
        .values({ playerId, kind: d.kind, at: d.at, data: JSON.stringify(d.data) })
        .run();
  }

  /** Plays the absence of players who left a minute ago forward, then sends what is due. */
  async sweep(): Promise<void> {
    const at = this.deps.now();
    for (const [playerId, leftAt] of [...this.left]) {
      if (at - leftAt < LEFT_AFTER_MS) continue;
      this.left.delete(playerId);
      if (this.deps.online(playerId)) continue;
      const state = this.deps.stateOf(playerId, at);
      if (!state) continue;
      // What was foreseen before goes; a siege heard meanwhile stays (session 181).
      this.deps.db
        .delete(pushDue)
        .where(and(eq(pushDue.playerId, playerId), inArray(pushDue.kind, ['stop', 'rest'])))
        .run();
      this.queue(
        playerId,
        foresee(this.deps.engine, state, leftAt).map((f) =>
          f.kind === 'stop'
            ? { kind: 'stop', at: f.at, data: f.event }
            : { kind: 'rest', at: f.at, data: { restsAt: f.restsAt } },
        ),
      );
    }
    const due = this.deps.db.select().from(pushDue).where(lte(pushDue.at, at)).orderBy(asc(pushDue.at)).all();
    const players = [...new Set(due.map((d) => d.playerId))];
    for (const playerId of players)
      await this.send(
        playerId,
        due.filter((d) => d.playerId === playerId),
        at,
      );
  }

  private async send(playerId: string, due: { id: number; kind: string; data: string }[], at: number) {
    const { db } = this.deps;
    const drop = () => {
      for (const d of due) db.delete(pushDue).where(eq(pushDue.id, d.id)).run();
    };
    const subs = this.subs(playerId);
    if (this.deps.online(playerId) || !subs.length) return drop();
    const tz = subs[subs.length - 1].tz;
    if (isQuiet(at, tz)) {
      const until = quietEnds(at, tz);
      for (const d of due) db.update(pushDue).set({ at: until }).where(eq(pushDue.id, d.id)).run();
      return;
    }
    const day = localDay(at, tz);
    const sent = db
      .select()
      .from(pushSent)
      .where(and(eq(pushSent.playerId, playerId), eq(pushSent.day, day)))
      .get();
    drop();
    if ((sent?.count ?? 0) >= PUSH_A_DAY) return;
    const payload = JSON.stringify(notice(due, tz));
    db.insert(pushSent)
      .values({ playerId, day, count: 1 })
      .onConflictDoUpdate({ target: [pushSent.playerId, pushSent.day], set: { count: (sent?.count ?? 0) + 1 } })
      .run();
    for (const sub of subs) {
      const status = await this.sender(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      // The browser let go of it: it is gone for good.
      if (status === 404 || status === 410) db.delete(pushSubs).where(eq(pushSubs.id, sub.id)).run();
    }
  }

  /** An account deleted: where its notices went, and what waited, go with it. */
  remove(playerId: string): void {
    const { db } = this.deps;
    this.left.delete(playerId);
    db.delete(pushSubs).where(eq(pushSubs.playerId, playerId)).run();
    db.delete(pushDue).where(eq(pushDue.playerId, playerId)).run();
    db.delete(pushSent).where(eq(pushSent.playerId, playerId)).run();
  }

  /** An account deleted: its name goes from a siege still waiting to be told (session 265), as from notices. */
  forgetFoe(name: string): void {
    this.deps.db
      .update(pushDue)
      .set({ data: sql`json_set(${pushDue.data}, '$.foe', '')` })
      .where(and(eq(pushDue.kind, 'siege'), sql`json_extract(${pushDue.data}, '$.foe') = ${name}`))
      .run();
  }
}

/** One notice for what is due, the most pressing first (a siege, a stop, the lanes resting), the rest
 *  counted after it; with where to go. */
export function notice(due: readonly { kind: string; data: string }[], tz: string) {
  const order = ['siege', 'stop', 'rest'];
  const lines = [...due]
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
    .map((d) => {
      const data = JSON.parse(d.data) as Record<string, unknown>;
      if (d.kind === 'rest')
        return { text: t('push.resting', { time: localTime(data.restsAt as number, tz) }), href: '/' };
      const line = recap.noticeLine(data as unknown as GameEvent);
      return line ? { text: line.text, href: line.href ?? '/' } : null;
    })
    .filter((x) => x !== null);
  const first = lines[0] ?? { text: t('push.title'), href: '/' };
  const more = lines.length - 1;
  const body =
    more <= 0
      ? first.text
      : more === 1
        ? t('push.moreOne', { line: first.text })
        : t('push.more', { line: first.text, count: fmt.int(more) });
  return { title: t('push.title'), body, url: first.href, tag: 'idle-clash' };
}
