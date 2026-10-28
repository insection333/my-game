// Feedback and the players' panel (session 18, docs/CLOSED_TEST.md): any player can send feedback from
// Settings, and the admin page lists the players (the days they came back, what the Hearth asks of
// them) and their feedback, to copy and pass on. The days a player came to the game are kept a row a
// day, for "back on day two and three". Feedback is the one free text players write that others read,
// so it is held to a pace (ten an hour, thirty a day), the same words twice are kept once, and only a
// player's newest fifty are kept: no one can fill the server with it.
import { ROUTES, type AdminTestResponse, type FeedbackView, type TesterView } from '@idle-clash/contracts';
import type { Feature, GoalsView } from '@idle-clash/features';
import { and, desc, eq, lt } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { isAdmin, requireAdmin, requirePlayer } from './auth/routes.ts';
import { limit, type Ctx } from './context.ts';
import { feedback, hiscores, players, visits } from './db/schema.ts';
import { contractRoute } from './http.ts';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Feedback a player may send in an hour and in a day, and how many of theirs are kept. */
export const FEEDBACK_PACE = { hour: 10, day: 30, kept: 50 };
const dayOf = (at: number) => new Date(at).toISOString().slice(0, 10);

/** Notes that a player came to the game today (once a day; cheap enough for every read). */
export function noteVisit(ctx: Ctx, playerId: string, at: number): void {
  ctx.db
    .insert(visits)
    .values({ playerId, day: dayOf(at) })
    .onConflictDoNothing()
    .run();
}

/** Removes a player's feedback and visits (their account is being deleted). */
export function eraseFeedback(ctx: Ctx, playerId: string): void {
  ctx.db.delete(feedback).where(eq(feedback.playerId, playerId)).run();
  ctx.db.delete(visits).where(eq(visits.playerId, playerId)).run();
}

export function feedbackRoutes(app: FastifyInstance, ctx: Ctx, features: readonly Feature[]): void {
  const now = () => ctx.config.now();

  contractRoute<{ text: string; page: string }>(
    app,
    ROUTES.feedback,
    ({ req, reply, input }) => {
      const id = req.playerId!;
      limit(ctx, reply, `feedback:hour:${id}`, FEEDBACK_PACE.hour, HOUR);
      limit(ctx, reply, `feedback:day:${id}`, FEEDBACK_PACE.day, DAY);
      const t = now();
      const mine = eq(feedback.playerId, id);
      // The same words again (a double press, or a second try) are already with the team.
      const last = ctx.db.select().from(feedback).where(mine).orderBy(desc(feedback.id)).limit(1).get();
      if (last?.text === input.text) return reply.code(204).send();
      ctx.store.sqlite.transaction(() => {
        ctx.db.insert(feedback).values({ playerId: id, at: t, page: input.page, text: input.text }).run();
        // Only the newest are kept.
        const keep = ctx.db
          .select({ id: feedback.id })
          .from(feedback)
          .where(mine)
          .orderBy(desc(feedback.id))
          .limit(1)
          .offset(FEEDBACK_PACE.kept - 1)
          .get();
        if (keep)
          ctx.db
            .delete(feedback)
            .where(and(mine, lt(feedback.id, keep.id)))
            .run();
      })();
      return reply.code(204).send();
    },
    requirePlayer(ctx),
  );

  /** What the Hearth's goals ask of a player now, in the game's own words. */
  const goals = features.find((f) => f.id === 'goals');
  const aimsOf = (playerId: string): string[] => {
    const saved = ctx.store.read(playerId, now());
    const view =
      saved && goals ? (goals.slots['hearth.goals']({ state: saved.doc.state, now: now() }) as unknown) : null;
    return ((view as GoalsView | null)?.rows ?? []).filter((r) => r.state !== 'claimed').map((r) => r.name);
  };
  const daysOf = (playerId: string) =>
    new Set(
      ctx.db
        .select({ day: visits.day })
        .from(visits)
        .where(eq(visits.playerId, playerId))
        .all()
        .map((v) => v.day),
    );
  const totalOf = (playerId: string) =>
    ctx.db
      .select({ level: hiscores.level })
      .from(hiscores)
      .where(and(eq(hiscores.playerId, playerId), eq(hiscores.skill, 'total')))
      .get()?.level ?? 0;

  contractRoute(
    app,
    ROUTES.adminTest,
    () => {
      const testers: TesterView[] = ctx.db
        .select()
        .from(players)
        .orderBy(desc(players.createdAt))
        .limit(200)
        .all()
        // The admins run the test; the players are everyone else.
        .filter((p) => !isAdmin(ctx, p.name))
        .map((p) => {
          const days = daysOf(p.id);
          const last = [...days].sort().at(-1);
          // Back on a day: yes or no once it has come; null while it is still ahead.
          const back = (at: number) => (dayOf(at) > dayOf(now()) ? null : days.has(dayOf(at)));
          return {
            name: p.name,
            joinedAt: p.createdAt,
            daysPlayed: days.size,
            day2: back(p.createdAt + DAY),
            day3: back(p.createdAt + 2 * DAY),
            lastSeen: last ? Date.parse(`${last}T00:00:00Z`) : null,
            totalLevel: totalOf(p.id),
            aims: aimsOf(p.id),
          };
        });
      const notes: FeedbackView[] = ctx.db
        .select({ f: feedback, name: players.name })
        .from(feedback)
        .leftJoin(players, eq(players.id, feedback.playerId))
        .orderBy(desc(feedback.id))
        .limit(200)
        .all()
        .map(({ f, name }) => ({
          name,
          at: f.at,
          page: f.page,
          text: f.text,
          totalLevel: totalOf(f.playerId),
          daysPlayed: daysOf(f.playerId).size,
        }));
      return { testers, feedback: notes } satisfies AdminTestResponse;
    },
    requireAdmin(ctx),
  );
}
