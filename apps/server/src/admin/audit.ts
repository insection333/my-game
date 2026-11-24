// The console's Audit log (session 228): every admin action, by whom, to whom and what it changed, kept in
// `admin_actions` (as well as telemetry, by id). Names are kept as they were, so the log reads after a
// rename or an account deleted.
import { AUDIT_PAGE, ROUTES, type AuditEntry, type AuditResponse } from '@idle-clash/contracts';
import { and, desc, eq, like, lt, or } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { requireAdmin } from '../auth/routes.ts';
import type { Ctx } from '../context.ts';
import { adminActions, players } from '../db/schema.ts';
import { contractRoute } from '../http.ts';

const nameOf = (ctx: Ctx, id: string): string | null =>
  ctx.db.select({ name: players.name }).from(players).where(eq(players.id, id)).get()?.name ?? null;

/** Records what an admin did. `detail`: what changed, as values the console says in its own words. */
export function audit(
  ctx: Ctx,
  req: FastifyRequest,
  action: string,
  targetId: string | null,
  detail?: Record<string, string | number>,
): void {
  const actorId = req.playerId!;
  ctx.db
    .insert(adminActions)
    .values({
      at: ctx.config.now(),
      actorId,
      actorName: nameOf(ctx, actorId) ?? '',
      action,
      targetId,
      targetName: targetId ? nameOf(ctx, targetId) : null,
      detail: detail ? JSON.stringify(detail) : null,
    })
    .run();
  ctx.telemetry.record(`admin.${action}`, actorId, targetId ? { target: targetId } : undefined);
}

export function auditRoutes(app: FastifyInstance, ctx: Ctx): void {
  contractRoute<{ query: string; before: number | null }>(
    app,
    ROUTES.adminAudit,
    ({ input }) => {
      const q = input.query.trim();
      const words = q ? `%${q}%` : null;
      const rows = ctx.db
        .select()
        .from(adminActions)
        .where(
          and(
            input.before ? lt(adminActions.id, input.before) : undefined,
            words
              ? or(
                  like(adminActions.action, words),
                  like(adminActions.actorName, words),
                  like(adminActions.targetName, words),
                )
              : undefined,
          ),
        )
        .orderBy(desc(adminActions.id))
        .limit(AUDIT_PAGE + 1)
        .all();
      const entries: AuditEntry[] = rows.slice(0, AUDIT_PAGE).map((r) => ({
        id: r.id,
        at: r.at,
        actor: r.actorName,
        action: r.action,
        target: r.targetName,
        targetId: r.targetId,
        detail: r.detail ? (JSON.parse(r.detail) as Record<string, string | number>) : null,
      }));
      return { entries, more: rows.length > AUDIT_PAGE ? entries.at(-1)!.id : null } satisfies AuditResponse;
    },
    requireAdmin(ctx),
  );
}
