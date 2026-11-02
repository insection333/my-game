// Bad actors (session 39). A player reports another by name, for an offensive name or for cheating and
// abuse: no words of their own, ten a day, once per target and reason (reporting again changes nothing
// until it is settled), and never themselves. The answer is the same whether the report is new, repeated
// or about a banned player, so reporting reveals nothing. The admin page lists the players reported, those
// reported by players who have played a while weighed first, to dismiss or to act on (renaming or banning
// settles their reports); and every siege between two lords over the last 30 days, summed by pair, so gold
// flowing one way between two accounts shows.
import {
  MODERATION_ROUTES,
  nameKey,
  type AdminReportsResponse,
  type AdminSiegeFlowsResponse,
  type ReportReason,
  type ReportedView,
} from '@idle-clash/contracts';
import { and, eq, gte, isNull, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { isAdmin, requireAdmin, requirePlayer } from './auth/routes.ts';
import { limit, type Ctx } from './context.ts';
import { players, reports, siegeFlows } from './db/schema.ts';
import { contractRoute, fail } from './http.ts';

const DAY = 86_400_000;
/** Reports a player may make in a day. */
export const REPORTS_A_DAY = 10;
/** How far back the admin's view of sieges between lords reaches, and how long they are kept. */
export const FLOW_DAYS = 30;
/** Sieges from one lord on another in that time before the pair is shown. */
export const FLOW_SIEGES = 4;

/** Notes a siege between two lords (in the siege's own transaction). */
export function noteSiege(ctx: Ctx, attackerId: string, defenderId: string, at: number, gold: number, breach: boolean) {
  ctx.db
    .insert(siegeFlows)
    .values({ attackerId, defenderId, at, gold: Math.floor(gold), breach: breach ? 1 : 0 })
    .run();
}

/** Settles every open report about a player (an admin dismissed them, or renamed or banned the player). */
export function settleReports(ctx: Ctx, playerId: string, at: number): void {
  ctx.db
    .update(reports)
    .set({ settledAt: at })
    .where(and(eq(reports.targetId, playerId), isNull(reports.settledAt)))
    .run();
}

/** Removes a player's reports, made or received, and their sieges (their account is being deleted). */
export function eraseModeration(ctx: Ctx, playerId: string): void {
  ctx.db.delete(reports).where(eq(reports.reporterId, playerId)).run();
  ctx.db.delete(reports).where(eq(reports.targetId, playerId)).run();
  ctx.db.delete(siegeFlows).where(eq(siegeFlows.attackerId, playerId)).run();
  ctx.db.delete(siegeFlows).where(eq(siegeFlows.defenderId, playerId)).run();
}

/** Lets go of sieges older than the admin's view, and settled reports older than three months. */
export function sweepModeration(ctx: Ctx, now: number): void {
  ctx.db
    .delete(siegeFlows)
    .where(sql`${siegeFlows.at} < ${now - FLOW_DAYS * DAY}`)
    .run();
  ctx.db
    .delete(reports)
    .where(sql`${reports.settledAt} is not null and ${reports.settledAt} < ${now - 90 * DAY}`)
    .run();
}

export function moderationRoutes(app: FastifyInstance, ctx: Ctx): void {
  const now = () => ctx.config.now();
  const admin = requireAdmin(ctx);

  contractRoute<{ name: string; reason: ReportReason }>(
    app,
    MODERATION_ROUTES.reportPlayer,
    ({ req, reply, input }) => {
      const reporter = req.playerId!;
      limit(ctx, reply, `report:${reporter}`, REPORTS_A_DAY, DAY);
      const target = ctx.db
        .select({ id: players.id })
        .from(players)
        .where(eq(players.nameKey, nameKey(input.name)))
        .get();
      if (!target) throw fail(404, 'notFound');
      if (target.id === reporter) throw fail(422, 'invalidInput', { fields: ['name'] });
      // An admin is never reported into a queue that admins read about themselves.
      if (!isAdmin(ctx, input.name)) {
        const t = now();
        ctx.db
          .insert(reports)
          .values({
            reporterId: reporter,
            targetId: target.id,
            reason: input.reason,
            at: t,
            reporterListed: ctx.hiscores.isListed(reporter) ? 1 : 0,
          })
          // Made again after it was settled, it opens again; while open, it stands as it was.
          .onConflictDoUpdate({
            target: [reports.reporterId, reports.targetId, reports.reason],
            set: { at: t, settledAt: null },
            where: sql`${reports.settledAt} is not null`,
          })
          .run();
      }
      return reply.code(204).send();
    },
    requirePlayer(ctx),
  );

  contractRoute(
    app,
    MODERATION_ROUTES.adminReports,
    () => {
      const rows = ctx.db
        .select({ r: reports, name: players.name, bannedAt: players.bannedAt })
        .from(reports)
        .innerJoin(players, eq(players.id, reports.targetId))
        .where(isNull(reports.settledAt))
        .all();
      const by = new Map<string, ReportedView & { seen: Set<string>; listedSeen: Set<string> }>();
      for (const { r, name, bannedAt } of rows) {
        let v = by.get(r.targetId);
        if (!v) {
          v = {
            playerId: r.targetId,
            name,
            bannedAt,
            reasons: { name: 0, cheating: 0 },
            reporters: 0,
            listedReporters: 0,
            first: r.at,
            last: r.at,
            seen: new Set(),
            listedSeen: new Set(),
          };
          by.set(r.targetId, v);
        }
        if (r.reason === 'name' || r.reason === 'cheating') v.reasons[r.reason]++;
        v.seen.add(r.reporterId);
        if (r.reporterListed) v.listedSeen.add(r.reporterId);
        v.first = Math.min(v.first, r.at);
        v.last = Math.max(v.last, r.at);
      }
      const reported = [...by.values()]
        .map(({ seen, listedSeen, ...v }) => ({ ...v, reporters: seen.size, listedReporters: listedSeen.size }))
        // Those reported by players who have played a while first, then by how many, then the newest.
        .sort((a, b) => b.listedReporters - a.listedReporters || b.reporters - a.reporters || b.last - a.last)
        .slice(0, 100);
      return { reported } satisfies AdminReportsResponse;
    },
    admin,
  );

  contractRoute<{ playerId: string }>(
    app,
    MODERATION_ROUTES.adminSettleReports,
    ({ req, reply, input }) => {
      settleReports(ctx, input.playerId, now());
      ctx.telemetry.record('admin.dismissReports', req.playerId, { target: input.playerId });
      return reply.code(204).send();
    },
    admin,
  );

  contractRoute(
    app,
    MODERATION_ROUTES.adminSiegeFlows,
    () => {
      const since = now() - FLOW_DAYS * DAY;
      const pairs = ctx.db
        .select({
          attackerId: siegeFlows.attackerId,
          defenderId: siegeFlows.defenderId,
          sieges: sql<number>`count(*)`,
          breaches: sql<number>`sum(${siegeFlows.breach})`,
          gold: sql<number>`sum(${siegeFlows.gold})`,
        })
        .from(siegeFlows)
        .where(gte(siegeFlows.at, since))
        .groupBy(siegeFlows.attackerId, siegeFlows.defenderId)
        .all();
      const count = new Map(pairs.map((p) => [`${p.attackerId}>${p.defenderId}`, p.sieges]));
      const shown = pairs
        .filter((p) => p.sieges >= FLOW_SIEGES)
        .sort((a, b) => b.gold - a.gold)
        .slice(0, 50);
      const ids = [...new Set(shown.flatMap((p) => [p.attackerId, p.defenderId]))];
      const names = new Map(
        ids.length
          ? ctx.db
              .select({ id: players.id, name: players.name })
              .from(players)
              .where(sql`${players.id} in ${ids}`)
              .all()
              .map((p) => [p.id, p.name])
          : [],
      );
      const flows = shown.map((p) => ({
        attacker: { id: p.attackerId, name: names.get(p.attackerId) ?? '' },
        defender: { id: p.defenderId, name: names.get(p.defenderId) ?? '' },
        sieges: p.sieges,
        breaches: p.breaches,
        gold: p.gold,
        back: count.get(`${p.defenderId}>${p.attackerId}`) ?? 0,
      }));
      return { flows } satisfies AdminSiegeFlowsResponse;
    },
    admin,
  );
}
