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
import { feedback, players, visits } from './db/schema.ts';
import { totalLevelOf } from './game/standing.ts';
import { contractRoute } from './http.ts';
import { memo, statements } from './admin/memo.ts';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Feedback a player may send in an hour and in a day, and how many of theirs are kept. */
export const FEEDBACK_PACE = { hour: 10, day: 30, kept: 50 };
const dayOf = (at: number) => new Date(at).toISOString().slice(0, 10);

/** The day each player's visit was last noted, by database: one write a player a day, not one a read. */
const noted = new WeakMap<Ctx['db'], Map<string, string>>();

/** Notes that a player came to the game today (once a day; cheap enough for every read). */
export function noteVisit(ctx: Ctx, playerId: string, at: number): void {
  const day = dayOf(at);
  let days = noted.get(ctx.db);
  if (!days) noted.set(ctx.db, (days = new Map<string, string>()));
  if (days.get(playerId) === day) return;
  ctx.db.insert(visits).values({ playerId, day }).onConflictDoNothing().run();
  days.set(playerId, day);
}

/** Removes a player's feedback and visits (their account is being deleted). */
export function eraseFeedback(ctx: Ctx, playerId: string): void {
  ctx.db.delete(feedback).where(eq(feedback.playerId, playerId)).run();
  ctx.db.delete(visits).where(eq(visits.playerId, playerId)).run();
  noted.get(ctx.db)?.delete(playerId);
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

  const st = statements(ctx.store.sqlite);
  /** What the Hearth's goals ask of a player now, in the game's own words. */
  const goals = features.find((f) => f.id === 'goals');
  // Kept for each tester while their save and the hour stand (session 234): reading a grown save and asking
  // the goals of it is the page's greatest cost, and a tester between visits asks the same as a minute ago.
  const aimsKept = new Map<string, { rev: number; hour: number; aims: string[] }>();
  const aimsOf = (playerId: string): string[] => {
    const rev = (st('select rev from saves where player_id = ?').get(playerId) as { rev: number } | undefined)?.rev;
    const hour = Math.floor(now() / 3_600_000);
    const was = aimsKept.get(playerId);
    if (was && was.rev === rev && was.hour === hour) return was.aims;
    const aims = aimsAfresh(playerId);
    // Testers come and go as players join: only the newest are kept.
    if (aimsKept.size > 4 * TESTERS) aimsKept.clear();
    if (rev !== undefined) aimsKept.set(playerId, { rev, hour, aims });
    return aims;
  };
  const aimsAfresh = (playerId: string): string[] => {
    const saved = ctx.store.read(playerId, now());
    const view =
      saved && goals ? (goals.slots['hearth.goals']({ state: saved.doc.state, now: now() }) as unknown) : null;
    return ((view as GoalsView | null)?.rows ?? []).filter((r) => r.state !== 'claimed').map((r) => r.name);
  };
  // A player's visits summed in one walk of their own key (session 233), where every day was read out and
  // gathered in a set for each tester and each note.
  const visitsOf = (playerId: string, joinedAt: number) =>
    st(
      `select count(*) n, max(day) last, coalesce(max(day = @d2), 0) d2, coalesce(max(day = @d3), 0) d3
       from visits where player_id = @id`,
    ).get({ id: playerId, d2: dayOf(joinedAt + DAY), d3: dayOf(joinedAt + 2 * DAY) }) as {
      n: number;
      last: string | null;
      d2: number;
      d3: number;
    };
  const totalOf = (playerId: string) => totalLevelOf(ctx, playerId);

  // Read once a minute at most and shared (session 233): each tester's aims are read from their save, and
  // 200 of them held the server a quarter of a second on a grown realm. The closed test is of friends, so
  // the newest 25 players are its testers; the console's directory holds everyone.
  const readTest = memo(now, TEST_MS, () => testOf());
  contractRoute(app, ROUTES.adminTest, () => readTest(), requireAdmin(ctx));

  function testOf(): AdminTestResponse {
    const testers: TesterView[] = ctx.db
      .select()
      .from(players)
      .where(eq(players.role, 'player'))
      .orderBy(desc(players.createdAt))
      .limit(TESTERS)
      .all()
      // The admins run the test, as does the console's own account; the players are everyone else.
      .filter((p) => !isAdmin(ctx, p.name))
      .map((p) => {
        const v = visitsOf(p.id, p.createdAt);
        const away = !v.last || v.last < dayOf(now() - 2 * DAY);
        // Back on a day: yes or no once it has come; null while it is still ahead.
        const back = (at: number, came: number) => (dayOf(at) > dayOf(now()) ? null : came === 1);
        return {
          name: p.name,
          joinedAt: p.createdAt,
          daysPlayed: v.n,
          day2: back(p.createdAt + DAY, v.d2),
          day3: back(p.createdAt + 2 * DAY, v.d3),
          lastSeen: v.last ? Date.parse(`${v.last}T00:00:00Z`) : null,
          totalLevel: totalOf(p.id),
          // What the Hearth asks of a tester at play: one away three days or more is asked nothing new, and
          // reading their save for it was the page's greatest cost.
          aims: away ? [] : aimsOf(p.id),
          away,
          listed: p.listedAt !== null,
        };
      });
    const notes: FeedbackView[] = ctx.db
      .select({ f: feedback, name: players.name })
      .from(feedback)
      .leftJoin(players, eq(players.id, feedback.playerId))
      .orderBy(desc(feedback.id))
      .limit(100)
      .all()
      .map(({ f, name }) => ({
        name,
        at: f.at,
        page: f.page,
        text: f.text,
        totalLevel: totalOf(f.playerId),
        daysPlayed: visitsOf(f.playerId, 0).n,
      }));
    return { testers, feedback: notes };
  }
}

/** The closed test's testers, the newest players, and how long its page's figures stand. */
export const TESTERS = 25;
export const TEST_MS = 60_000;
