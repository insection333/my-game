// A player's record in the console (session 229): who they are and how they stand (joined, last seen,
// online, browsers signed in, listed, muted, reports, the fire), what they hold and do (gold, kinds of item,
// every skill, each lane), their castle, and what admins have done to them. Read from the tables and the
// save as it stands, with the castle's standing mirrored in as the game reads it.
import { ROUTES, type AuditEntry, type RecordResponse } from '@idle-clash/contracts';
import { formatStop, hasString, levelFor, t } from '@idle-clash/content';
import { allSkills, careerOf, FEATURES, items } from '@idle-clash/features';
import { countOf, fireBusiestDay, LANE_IDS } from '@idle-clash/kernel';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth/routes.ts';
import { withCastle } from '../castle/mirror.ts';
import type { Ctx } from '../context.ts';
import { adminActions, mailMutes, playerBastions, players, reports, sessions, visits } from '../db/schema.ts';
import { totalLevelOf } from '../game/standing.ts';
import { contractRoute, fail } from '../http.ts';

/** An action in the game's own words, or its address where the game has none. */
const actionWords = (a: { feature: string; id: string }) => {
  const key = `action.${a.feature}.${a.id}`;
  return hasString(key) ? t(key) : `${a.feature}: ${a.id}`;
};
const LANES: Record<string, () => string> = {
  gathering: () => t('lane.gathering'),
  gathering2: () => t('lane.gathering2'),
  artisan: () => t('lane.artisan'),
  combat: () => t('lane.combat'),
};

/** Everything that can be given, gold first, by name. */
export const catalogOf = (): { id: string; name: string }[] => [
  { id: 'gold', name: t('console.grant.gold') },
  ...items
    .catalog(FEATURES)
    .filter((i) => i.id !== 'gold')
    .map((i) => ({ id: i.id, name: t(`item.${i.id}`) }))
    .sort((a, b) => a.name.localeCompare(b.name)),
];

export function recordOf(ctx: Ctx, playerId: string): RecordResponse {
  const now = ctx.config.now();
  const p = ctx.db.select().from(players).where(eq(players.id, playerId)).get();
  if (!p || p.role !== 'player') throw fail(404, 'notFound');
  const saved = ctx.store.read(playerId, now);
  if (!saved) throw fail(404, 'notFound');
  const state = withCastle(ctx, playerId, saved.doc.state, now);
  const reported = ctx.db
    .select({ reason: reports.reason, n: sql<number>`count(*)` })
    .from(reports)
    .where(and(eq(reports.targetId, playerId), isNull(reports.settledAt)))
    .groupBy(reports.reason)
    .all();
  const history: AuditEntry[] = ctx.db
    .select()
    .from(adminActions)
    .where(eq(adminActions.targetId, playerId))
    .orderBy(desc(adminActions.id))
    .limit(20)
    .all()
    .map((r) => ({
      id: r.id,
      at: r.at,
      actor: r.actorName,
      action: r.action,
      target: r.targetName,
      targetId: r.targetId,
      detail: r.detail ? (JSON.parse(r.detail) as Record<string, string | number>) : null,
    }));
  const castle = careerOf(state, now).castle;
  const rating = ctx.db
    .select({ rating: playerBastions.bastionRating })
    .from(playerBastions)
    .where(eq(playerBastions.userId, playerId))
    .get()?.rating;
  const muted = ctx.db.select().from(mailMutes).where(eq(mailMutes.playerId, playerId)).get();
  return {
    at: now,
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    bannedAt: p.bannedAt,
    seen:
      ctx.db
        .select({ day: sql<string | null>`max(${visits.day})` })
        .from(visits)
        .where(eq(visits.playerId, playerId))
        .get()?.day ?? null,
    online: ctx.live.has(playerId),
    sessions: ctx.db
      .select({ n: sql<number>`count(*)` })
      .from(sessions)
      .where(and(eq(sessions.playerId, playerId), gt(sessions.expiresAt, now)))
      .get()!.n,
    listed: p.listedAt !== null,
    mutedUntil: muted && muted.until > now ? muted.until : null,
    reports: {
      name: reported.find((r) => r.reason === 'name')?.n ?? 0,
      cheating: reported.find((r) => r.reason === 'cheating')?.n ?? 0,
    },
    totalLevel: totalLevelOf(ctx, playerId),
    fireHours: Math.round(fireBusiestDay(state) / 360_000) / 10,
    gold: countOf(state, 'gold'),
    kinds: Object.keys(state.items).filter((id) => id !== 'gold' && countOf(state, id) > 0).length,
    skills: allSkills().map((skill) => {
      const xp = Object.hasOwn(state.skills, skill) ? state.skills[skill].xp : 0;
      return { skill, name: t(`skill.${skill}`), level: levelFor(xp), xp };
    }),
    lanes: LANE_IDS.map((lane) => {
      const l = state.lanes[lane];
      const at = l.current?.action ?? l.stopped?.action ?? null;
      return {
        lane: LANES[lane](),
        doing: at ? actionWords(at) : null,
        stopped: !l.current && l.stopped ? formatStop(l.stopped.reason) : null,
      };
    }),
    castle: castle && rating !== undefined ? { level: castle.level, rating } : null,
    history,
    catalog: catalogOf(),
  };
}

export function recordRoutes(app: FastifyInstance, ctx: Ctx): void {
  contractRoute<{ playerId: string }>(
    app,
    ROUTES.adminRecord,
    ({ input }) => recordOf(ctx, input.playerId),
    requireAdmin(ctx),
  );
}
