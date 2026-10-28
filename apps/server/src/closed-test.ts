// The closed test (session 18, docs/CLOSED_TEST.md): while the server's INVITES switch is on, signing up
// takes an invite, each used once; any player can send feedback from Settings; and the admin page's
// panel lists the invites, the testers (the days they came back, what the Hearth asks of them) and the
// feedback. The days a player came to the game are kept a row a day, for "back on day two and three".
import {
  ROUTES,
  type AdminInviteResponse,
  type AdminTestResponse,
  type FeedbackView,
  type InviteView,
  type TesterView,
} from '@idle-clash/contracts';
import type { Feature, GoalsView } from '@idle-clash/features';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { randomInt } from 'node:crypto';
import { isAdmin, requireAdmin, requirePlayer } from './auth/routes.ts';
import { limit, type Ctx } from './context.ts';
import { feedback, hiscores, invites, players, visits } from './db/schema.ts';
import { contractRoute, fail } from './http.ts';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const dayOf = (at: number) => new Date(at).toISOString().slice(0, 10);

/** Notes that a player came to the game today (once a day; cheap enough for every read). */
export function noteVisit(ctx: Ctx, playerId: string, at: number): void {
  ctx.db
    .insert(visits)
    .values({ playerId, day: dayOf(at) })
    .onConflictDoNothing()
    .run();
}

/** Spends an invite on a new player, inside sign-up's transaction; refuses an unknown or used one. */
export function spendInvite(ctx: Ctx, code: string | undefined, playerId: string, at: number): void {
  if (!code) throw fail(403, 'inviteNeeded');
  const spent = ctx.db
    .update(invites)
    .set({ usedBy: playerId, usedAt: at })
    .where(and(eq(invites.code, code), isNull(invites.usedAt)))
    .run();
  if (spent.changes !== 1) throw fail(403, 'inviteUnknown');
}

/** Removes a player's feedback and visits, and their name from the invite they used (still spent). */
export function eraseTester(ctx: Ctx, playerId: string): void {
  ctx.db.delete(feedback).where(eq(feedback.playerId, playerId)).run();
  ctx.db.delete(visits).where(eq(visits.playerId, playerId)).run();
  ctx.db.update(invites).set({ usedBy: null }).where(eq(invites.usedBy, playerId)).run();
}

/** A code to read out or paste: twelve letters and digits that cannot be mistaken for each other. */
function freshCode(): string {
  const letters = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 12 }, () => letters[randomInt(letters.length)]).join('');
}

export function closedTestRoutes(app: FastifyInstance, ctx: Ctx, features: readonly Feature[]): void {
  const now = () => ctx.config.now();
  const nameOf = (id: string | null) =>
    id ? (ctx.db.select({ name: players.name }).from(players).where(eq(players.id, id)).get()?.name ?? null) : null;

  contractRoute<{ text: string; page: string }>(
    app,
    ROUTES.feedback,
    ({ req, reply, input }) => {
      limit(ctx, reply, `feedback:${req.playerId!}`, 10, HOUR);
      ctx.db.insert(feedback).values({ playerId: req.playerId!, at: now(), page: input.page, text: input.text }).run();
      return reply.code(204).send();
    },
    requirePlayer(ctx),
  );

  contractRoute(
    app,
    ROUTES.adminInvite,
    () => {
      const code = freshCode();
      ctx.db.insert(invites).values({ code, createdAt: now() }).run();
      return { code } satisfies AdminInviteResponse;
    },
    requireAdmin(ctx),
  );

  /** What the Hearth's goals ask of a player now, in the game's own words. */
  const goals = features.find((f) => f.id === 'goals');
  const aimsOf = (playerId: string): string[] => {
    const saved = ctx.store.read(playerId, now());
    const view =
      saved && goals ? (goals.slots['hearth.goals']({ state: saved.doc.state, now: now() }) as unknown) : null;
    return ((view as GoalsView | null)?.rows ?? []).filter((r) => r.state !== 'claimed').map((r) => r.name);
  };

  contractRoute(
    app,
    ROUTES.adminTest,
    () => {
      const inviteRows: InviteView[] = ctx.db
        .select()
        .from(invites)
        .orderBy(desc(invites.createdAt))
        .limit(100)
        .all()
        .map((i) => ({ code: i.code, createdAt: i.createdAt, usedBy: nameOf(i.usedBy), usedAt: i.usedAt }));
      const testers: TesterView[] = ctx.db
        .select()
        .from(players)
        .orderBy(desc(players.createdAt))
        .limit(200)
        .all()
        // The admins run the test; the testers are everyone else.
        .filter((p) => !isAdmin(ctx, p.name))
        .map((p) => {
          const days = new Set(
            ctx.db
              .select({ day: visits.day })
              .from(visits)
              .where(eq(visits.playerId, p.id))
              .all()
              .map((v) => v.day),
          );
          const total = ctx.db
            .select({ level: hiscores.level })
            .from(hiscores)
            .where(and(eq(hiscores.playerId, p.id), eq(hiscores.skill, 'total')))
            .get();
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
            totalLevel: total?.level ?? 0,
            aims: aimsOf(p.id),
          };
        });
      const notes: FeedbackView[] = ctx.db
        .select()
        .from(feedback)
        .orderBy(desc(feedback.at))
        .limit(100)
        .all()
        .map((f) => ({ name: nameOf(f.playerId), at: f.at, page: f.page, text: f.text }));
      return {
        invitesRequired: ctx.config.invitesRequired,
        invites: inviteRows,
        testers,
        feedback: notes,
      } satisfies AdminTestResponse;
    },
    requireAdmin(ctx),
  );
}
