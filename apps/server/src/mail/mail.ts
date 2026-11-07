// Letters between players (session 45): the rules a letter is sent by, and the inbox it lands in. A letter
// is plain text of at most 250 characters with no foul language (a refused one is kept for the admin and
// flags its sender's letters that day); it goes to a player who exists, is not banned, is not the sender
// and has not blocked them; a sender waits 15 seconds between letters and writes to at most ten players a
// day; an inbox holds 20, the oldest going first; read letters go after 7 days and unread after 14.
import { MAIL, nameKey, type InboxResponse, type Letter, type SendResult } from '@idle-clash/contracts';
import { and, desc, eq, gt, isNotNull, isNull, lt, notInArray, or, sql } from 'drizzle-orm';
import type { Ctx } from '../context.ts';
import { mail, mailBlocks, mailMutes, mailRefused, players } from '../db/schema.ts';
import { readLook } from '../game/look.ts';
import { cleanMessage, messageAllowed } from './filter.ts';

const DAY = 86_400_000;
export const READ_KEPT_DAYS = 7;
export const UNREAD_KEPT_DAYS = 14;
export const REFUSED_KEPT_DAYS = 30;

const unreadOf = (ctx: Ctx, playerId: string): number =>
  ctx.db
    .select({ n: sql<number>`count(*)` })
    .from(mail)
    .where(and(eq(mail.toId, playerId), isNull(mail.readAt)))
    .get()!.n;

/** Tells the recipient's open pages how many letters wait. */
export const announceMail = (ctx: Ctx, playerId: string): void =>
  ctx.live.publish(playerId, { type: 'mail', unread: unreadOf(ctx, playerId) });

export function mutedUntil(ctx: Ctx, playerId: string, now: number): number | null {
  const m = ctx.db.select().from(mailMutes).where(eq(mailMutes.playerId, playerId)).get();
  return m && m.until > now ? m.until : null;
}

/** Sends a letter, or says why not. The time of the last letter is the sender's newest in the table. */
export function send(ctx: Ctx, fromId: string, toName: string, raw: string, now: number): SendResult {
  const to = ctx.db
    .select({ id: players.id, bannedAt: players.bannedAt })
    .from(players)
    .where(eq(players.nameKey, nameKey(toName)))
    .get();
  // Names are public (the ladders), so a name that is no one's is said as such; a banned player's is not.
  if (!to) return { ok: false, reason: 'noPlayer' };
  if (to.bannedAt !== null) return { ok: false, reason: 'blocked' };
  if (to.id === fromId) return { ok: false, reason: 'self' };
  if (mutedUntil(ctx, fromId, now) !== null) return { ok: false, reason: 'muted' };
  const body = cleanMessage(raw);
  if (!body) return { ok: false, reason: 'empty' };
  if (body.length > MAIL.MAX_CHARS) return { ok: false, reason: 'tooLong' };
  const blocked = ctx.db
    .select({ at: mailBlocks.at })
    .from(mailBlocks)
    .where(and(eq(mailBlocks.blockerId, to.id), eq(mailBlocks.blockedId, fromId)))
    .get();
  // A block is said as one, so the sender knows to stop; what the recipient thinks of them is not.
  if (blocked) return { ok: false, reason: 'blocked' };
  const last = ctx.db
    .select({ at: mail.at })
    .from(mail)
    .where(eq(mail.fromId, fromId))
    .orderBy(desc(mail.at))
    .limit(1)
    .get();
  if (last && now - last.at < MAIL.COOLDOWN_MS) return { ok: false, reason: 'cooldown' };
  const today = ctx.db
    .selectDistinct({ toId: mail.toId })
    .from(mail)
    .where(and(eq(mail.fromId, fromId), gt(mail.at, now - DAY)))
    .all()
    .map((r) => r.toId);
  if (!today.includes(to.id) && today.length >= MAIL.PLAYERS_A_DAY) return { ok: false, reason: 'tooManyPlayers' };
  if (!messageAllowed(body)) {
    ctx.db.insert(mailRefused).values({ fromId, toId: to.id, body, at: now }).run();
    return { ok: false, reason: 'language' };
  }
  const tried = ctx.db
    .select({ n: sql<number>`count(*)` })
    .from(mailRefused)
    .where(and(eq(mailRefused.fromId, fromId), gt(mailRefused.at, now - DAY)))
    .get()!.n;
  ctx.store.sqlite.transaction(() => {
    ctx.db
      .insert(mail)
      .values({ toId: to.id, fromId, body, at: now, flagged: tried > 0 ? 1 : 0 })
      .run();
    // The inbox keeps its newest; the oldest goes first.
    const keep = ctx.db
      .select({ id: mail.id })
      .from(mail)
      .where(eq(mail.toId, to.id))
      .orderBy(desc(mail.at), desc(mail.id))
      .limit(MAIL.INBOX)
      .all()
      .map((r) => r.id);
    ctx.db
      .delete(mail)
      .where(and(eq(mail.toId, to.id), notInArray(mail.id, keep)))
      .run();
  })();
  announceMail(ctx, to.id);
  return { ok: true };
}

export function inbox(ctx: Ctx, playerId: string, now: number): InboxResponse {
  const rows = ctx.db
    .select({ id: mail.id, body: mail.body, at: mail.at, readAt: mail.readAt, from: players.name, look: players.look })
    .from(mail)
    .leftJoin(players, eq(players.id, mail.fromId))
    .where(eq(mail.toId, playerId))
    .orderBy(desc(mail.at), desc(mail.id))
    .all();
  // A letter from a player since gone is gone with them (eraseMail); one with no player is the game's own.
  const letters: Letter[] = rows.map((r) => ({
    id: r.id,
    from: r.from ?? '',
    realm: r.from === null,
    look: r.from === null ? null : readLook(r.look),
    body: r.body,
    at: r.at,
    read: r.readAt !== null,
  }));
  const blocked = ctx.db
    .select({ name: players.name })
    .from(mailBlocks)
    .innerJoin(players, eq(players.id, mailBlocks.blockedId))
    .where(eq(mailBlocks.blockerId, playerId))
    .orderBy(players.name)
    .all()
    .map((r) => r.name);
  return {
    letters,
    unread: letters.filter((l) => !l.read).length,
    blocked,
    mutedUntil: mutedUntil(ctx, playerId, now),
  };
}

/** Marks every letter read (the inbox was opened). */
export function readAll(ctx: Ctx, playerId: string, now: number): void {
  ctx.db
    .update(mail)
    .set({ readAt: now })
    .where(and(eq(mail.toId, playerId), isNull(mail.readAt)))
    .run();
  announceMail(ctx, playerId);
}

export function remove(ctx: Ctx, playerId: string, id: number): void {
  ctx.db
    .delete(mail)
    .where(and(eq(mail.id, id), eq(mail.toId, playerId)))
    .run();
  announceMail(ctx, playerId);
}

/** Blocks a player's letters, or lets them through again. Their letters already in the inbox go. */
export function block(ctx: Ctx, playerId: string, name: string, blocked: boolean, now: number): boolean {
  const other = ctx.db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.nameKey, nameKey(name)))
    .get();
  if (!other || other.id === playerId) return false;
  if (blocked) {
    ctx.db.insert(mailBlocks).values({ blockerId: playerId, blockedId: other.id, at: now }).onConflictDoNothing().run();
    ctx.db
      .delete(mail)
      .where(and(eq(mail.toId, playerId), eq(mail.fromId, other.id)))
      .run();
    announceMail(ctx, playerId);
  } else
    ctx.db
      .delete(mailBlocks)
      .where(and(eq(mailBlocks.blockerId, playerId), eq(mailBlocks.blockedId, other.id)))
      .run();
  return true;
}

/** The housekeeping: read letters past 7 days, unread past 14, refused ones past 30, ended mutes. */
export function sweepMail(ctx: Ctx, now: number): void {
  ctx.db
    .delete(mail)
    .where(
      or(
        and(isNotNull(mail.readAt), lt(mail.readAt, now - READ_KEPT_DAYS * DAY)),
        and(isNull(mail.readAt), lt(mail.at, now - UNREAD_KEPT_DAYS * DAY)),
      ),
    )
    .run();
  ctx.db
    .delete(mailRefused)
    .where(lt(mailRefused.at, now - REFUSED_KEPT_DAYS * DAY))
    .run();
  ctx.db.delete(mailMutes).where(lt(mailMutes.until, now)).run();
}

/** Everything of a player's in the mail goes with their account: letters to and from them, blocks either
 *  way, refused letters and a mute. */
export function eraseMail(ctx: Ctx, playerId: string): void {
  ctx.db
    .delete(mail)
    .where(or(eq(mail.toId, playerId), eq(mail.fromId, playerId)))
    .run();
  ctx.db
    .delete(mailBlocks)
    .where(or(eq(mailBlocks.blockerId, playerId), eq(mailBlocks.blockedId, playerId)))
    .run();
  ctx.db
    .delete(mailRefused)
    .where(or(eq(mailRefused.fromId, playerId), eq(mailRefused.toId, playerId)))
    .run();
  ctx.db.delete(mailMutes).where(eq(mailMutes.playerId, playerId)).run();
}
