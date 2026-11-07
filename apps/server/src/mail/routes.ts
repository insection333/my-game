// The routes for letters (session 45): the inbox, sending, marking read, deleting, blocking; and the admin's
// monitor of every player's letters, refused letters and who keeps trying, with warn, mute and unmute.
import {
  MAIL_ROUTES,
  nameKey,
  type AdminLetter,
  type AdminMailResponse,
  type AdminRefused,
} from '@idle-clash/contracts';
import { t } from '@idle-clash/content';
import { alias } from 'drizzle-orm/sqlite-core';
import { and, desc, eq, gt, like, or, sql, type SQL } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireAdmin, requirePlayer } from '../auth/routes.ts';
import { limit, type Ctx } from '../context.ts';
import { mail, mailMutes, mailRefused, players } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';
import { announceMail, block, inbox, readAll, remove, send } from './mail.ts';

const DAY = 86_400_000;
export const MUTE_DAYS = 7;
const SHOWN = 200;

const idOf = (ctx: Ctx, name: string) =>
  ctx.db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.nameKey, nameKey(name)))
    .get()?.id ?? null;

export function mailRoutes(app: FastifyInstance, ctx: Ctx): void {
  const now = () => ctx.config.now();
  const player = requirePlayer(ctx);

  contractRoute(app, MAIL_ROUTES.mailInbox, ({ req }) => inbox(ctx, req.playerId!, now()), player);

  contractRoute<{ to: string; body: string }>(
    app,
    MAIL_ROUTES.mailSend,
    ({ req, reply, input }) => {
      // Past the rules' own limits, a flood of attempts is stopped outright.
      limit(ctx, reply, `mail:${req.playerId!}`, 20, 60_000);
      return send(ctx, req.playerId!, input.to, input.body, now());
    },
    player,
  );

  contractRoute(
    app,
    MAIL_ROUTES.mailRead,
    ({ req, reply }) => {
      readAll(ctx, req.playerId!, now());
      return reply.code(204).send();
    },
    player,
  );

  contractRoute<{ id: number }>(
    app,
    MAIL_ROUTES.mailDelete,
    ({ req, reply, input }) => {
      remove(ctx, req.playerId!, input.id);
      return reply.code(204).send();
    },
    player,
  );

  contractRoute<{ name: string; blocked: boolean }>(
    app,
    MAIL_ROUTES.mailBlock,
    ({ req, reply, input }) => {
      limit(ctx, reply, `mailBlock:${req.playerId!}`, 30, 60_000);
      if (!block(ctx, req.playerId!, input.name, input.blocked, now())) throw fail(404, 'notFound');
      return inbox(ctx, req.playerId!, now());
    },
    player,
  );

  const admin = requireAdmin(ctx);
  const sender = alias(players, 'sender');
  const recipient = alias(players, 'recipient');

  contractRoute<{ player?: string; other?: string; text?: string; flagged?: boolean }>(
    app,
    MAIL_ROUTES.adminMail,
    ({ input }) => {
      const t0 = now();
      const who = input.player ? idOf(ctx, input.player) : null;
      const other = input.other ? idOf(ctx, input.other) : null;
      if ((input.player && !who) || (input.other && !other)) throw fail(404, 'notFound');
      const between = (from: SQL | undefined, to: SQL | undefined) => {
        if (who && other) return or(and(eq(from!, who), eq(to!, other)), and(eq(from!, other), eq(to!, who)));
        if (who) return or(eq(from!, who), eq(to!, who));
        return undefined;
      };
      const words = input.text ? `%${input.text.replace(/[%_]/g, '')}%` : null;
      const letters: AdminLetter[] = ctx.db
        .select({
          id: mail.id,
          from: sender.name,
          to: recipient.name,
          body: mail.body,
          at: mail.at,
          flagged: mail.flagged,
        })
        .from(mail)
        .innerJoin(sender, eq(sender.id, mail.fromId))
        .innerJoin(recipient, eq(recipient.id, mail.toId))
        .where(
          and(
            between(sql`${mail.fromId}`, sql`${mail.toId}`),
            words ? like(mail.body, words) : undefined,
            input.flagged ? eq(mail.flagged, 1) : undefined,
          ),
        )
        .orderBy(desc(mail.at))
        .limit(SHOWN)
        .all()
        .map((r) => ({ ...r, flagged: r.flagged === 1 }));
      const refused: AdminRefused[] = ctx.db
        .select({ from: sender.name, to: recipient.name, body: mailRefused.body, at: mailRefused.at })
        .from(mailRefused)
        .innerJoin(sender, eq(sender.id, mailRefused.fromId))
        .innerJoin(recipient, eq(recipient.id, mailRefused.toId))
        .where(
          and(
            between(sql`${mailRefused.fromId}`, sql`${mailRefused.toId}`),
            words ? like(mailRefused.body, words) : undefined,
          ),
        )
        .orderBy(desc(mailRefused.at))
        .limit(SHOWN)
        .all();
      const watch = ctx.db
        .select({ name: players.name, id: players.id, refused: sql<number>`count(*)` })
        .from(mailRefused)
        .innerJoin(players, eq(players.id, mailRefused.fromId))
        .where(gt(mailRefused.at, t0 - DAY))
        .groupBy(players.id)
        .orderBy(desc(sql`count(*)`))
        .limit(50)
        .all()
        .map((r) => ({
          name: r.name,
          refused: r.refused,
          muted: !!ctx.db
            .select()
            .from(mailMutes)
            .where(and(eq(mailMutes.playerId, r.id), gt(mailMutes.until, t0)))
            .get(),
        }));
      return { letters, refused, watch } satisfies AdminMailResponse;
    },
    admin,
  );

  contractRoute<{ player: string; action: 'warn' | 'mute' | 'unmute' }>(
    app,
    MAIL_ROUTES.adminMailAction,
    ({ req, reply, input }) => {
      const target = idOf(ctx, input.player);
      if (!target) throw fail(404, 'notFound');
      const t0 = now();
      if (input.action === 'warn') {
        // A warning is a letter from the admin who gave it, in the game's own words.
        ctx.db
          .insert(mail)
          .values({ toId: target, fromId: req.playerId!, body: t('mail.warning'), at: t0 })
          .run();
        announceMail(ctx, target);
      } else if (input.action === 'mute')
        ctx.db
          .insert(mailMutes)
          .values({ playerId: target, until: t0 + MUTE_DAYS * DAY })
          .onConflictDoUpdate({ target: mailMutes.playerId, set: { until: t0 + MUTE_DAYS * DAY } })
          .run();
      else ctx.db.delete(mailMutes).where(eq(mailMutes.playerId, target)).run();
      return reply.code(204).send();
    },
    admin,
  );
}
