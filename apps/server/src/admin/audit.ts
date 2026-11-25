// The console's Audit log (session 228): every admin action, by whom, to whom and what it changed, kept in
// `admin_actions` (as well as telemetry, by id). Names are kept as they were, so the log reads after a
// rename or an account deleted.
import { t } from '@idle-clash/content';
import { AUDIT_PAGE, FILE_PAGE, ROUTES, type AuditEntry, type AuditResponse } from '@idle-clash/contracts';
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { requireAdmin } from '../auth/routes.ts';
import type { Ctx } from '../context.ts';
import { adminActions, players } from '../db/schema.ts';
import { contractRoute } from '../http.ts';
import { changed } from './memo.ts';

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
  // What the console keeps (the directory) is made afresh, so the change shows at once (session 236).
  changed(ctx);
}

/** Every action the log keeps, as the console says it. */
const ACTIONS: Record<string, () => string> = {
  rename: () => t('audit.rename'),
  ban: () => t('audit.ban'),
  unban: () => t('audit.unban'),
  mend: () => t('audit.mend'),
  resetPassword: () => t('audit.resetPassword'),
  dismissReports: () => t('audit.dismissReports'),
  warn: () => t('audit.warn'),
  mute: () => t('audit.mute'),
  unmute: () => t('audit.unmute'),
  give: () => t('audit.give'),
  take: () => t('audit.take'),
  xp: () => t('audit.xp'),
  signOut: () => t('audit.signOut'),
  delete: () => t('audit.delete'),
  broadcast: () => t('audit.broadcast'),
  note: () => t('audit.note'),
  unnote: () => t('audit.unnote'),
  endSession: () => t('audit.endSession'),
  banner: () => t('audit.banner'),
  bannerDown: () => t('audit.bannerDown'),
  consolePassword: () => t('audit.consolePassword'),
};
/** The actions whose words, as the console says them ("Gave", "Banned"), hold what was typed (session 231). */
const said = (q: string) => Object.keys(ACTIONS).filter((a) => ACTIONS[a]().toLowerCase().includes(q.toLowerCase()));

export function auditRoutes(app: FastifyInstance, ctx: Ctx): void {
  contractRoute<{ query: string; before: number | null; file?: true }>(
    app,
    ROUTES.adminAudit,
    ({ input }) => {
      const q = input.query.trim();
      // A larger page for a file (session 234).
      const size = input.file ? FILE_PAGE : AUDIT_PAGE;
      // Anywhere in the action, either name or what it changed (an item, a skill, a reason: session 231);
      // % and _ taken literally.
      const words = q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
      const like = (col: SQLiteColumn) => sql`${col} like ${words} escape '\\'`;
      const rows = ctx.db
        .select()
        .from(adminActions)
        .where(
          and(
            input.before ? lt(adminActions.id, input.before) : undefined,
            words
              ? or(
                  like(adminActions.action),
                  like(adminActions.actorName),
                  like(adminActions.targetName),
                  like(adminActions.detail),
                  ...(said(q).length ? [inArray(adminActions.action, said(q))] : []),
                )
              : undefined,
          ),
        )
        .orderBy(desc(adminActions.id))
        .limit(size + 1)
        .all();
      const entries: AuditEntry[] = rows.slice(0, size).map((r) => ({
        id: r.id,
        at: r.at,
        actor: r.actorName,
        action: r.action,
        target: r.targetName,
        targetId: r.targetId,
        detail: r.detail ? (JSON.parse(r.detail) as Record<string, string | number>) : null,
      }));
      return { entries, more: rows.length > size ? entries.at(-1)!.id : null } satisfies AuditResponse;
    },
    requireAdmin(ctx),
  );
}
