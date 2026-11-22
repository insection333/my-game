// The game over HTTP: read your state, send a command, call a feature's route, and the live channel.
// Every change runs one at a time per player and acts once per request id (the kernel's `handle`).
import {
  featurePath,
  FeatureRequest,
  LIVE_PATH,
  ROUTES,
  type ActResponse,
  type GameResponse,
  type HiscoresResponse,
  type NoticesResponse,
} from '@idle-clash/contracts';
import { allSkills, type Feature } from '@idle-clash/features';
import {
  handle,
  RECAP_AFTER_MS,
  seeded,
  joinAway,
  summarizeAway,
  type AwaySummary,
  type Command,
  type GameEvent,
  type SaveDoc,
  type State,
} from '@idle-clash/kernel';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ipOf, limit, type Ctx } from '../context.ts';
import { castlesLadder } from './castles-ladder.ts';
import { SEASON, seasonLadderAt } from './season-ladder.ts';
import { TOTAL } from './hiscores.ts';
import { hear } from './watching.ts';
import { contractRoute, fail } from '../http.ts';
import { identify, keepCookie, requirePlayer } from '../auth/routes.ts';
import { SESSION_COOKIE, tokenHash } from '../auth/sessions.ts';
import { noteVisit } from '../feedback.ts';
import { announce as announceChange } from './announce.ts';
import { withCastle } from '../castle/mirror.ts';

export function gameRoutes(app: FastifyInstance, ctx: Ctx, features: readonly Feature[]): void {
  const now = () => ctx.config.now();

  /** Reads a player's save and advances it to now, without writing: what the page should show. With
   *  `recap`, a player away a quarter of an hour or more also gets what happened meanwhile. */
  const current = (playerId: string, recap = false): GameResponse => {
    const saved = ctx.store.read(playerId, now());
    if (!saved) throw fail(404, 'notFound');
    const t = now();
    noteVisit(ctx, playerId, t);
    const before = withCastle(ctx, playerId, saved.doc.state, t);
    const out = ctx.engine.advance(before, t, seeded(before.seed));
    const away = recap && t - before.lastSeen >= RECAP_AFTER_MS ? told(playerId, before, out, t) : null;
    // Back (or never away): nothing of an absence is kept for them (session 156's stress test).
    if (recap && !away) absences.delete(playerId);
    // The hiscores hear of progress whenever the page reads it, not only when the save is written.
    ctx.hiscores.update(playerId, out.state, t);
    return { state: out.state, now: t, away };
  };

  /** The recap of each player's absence so far, kept until they are back (session 155): the page records
   *  deeds and goals by itself, writing the save advanced to now while the player stays unseen, so a later
   *  read (a reload, another device) would otherwise tell only the minutes since that write. */
  const absences = new Map<string, { prior: AwaySummary | null; base: number; last: AwaySummary }>();
  const told = (playerId: string, before: State, out: { state: State; events: GameEvent[] }, t: number) => {
    const fresh = summarizeAway(before, out.state, out.events, t);
    const kept = absences.get(playerId);
    // The same absence on a save written since (its clock moved on): all told so far comes first, then what
    // the fresh read adds. On the same save, the fresh read holds all since that save.
    const same = kept && kept.last.from === fresh.from;
    const prior = !same ? null : before.clock > kept.base ? kept.last : kept.prior;
    const away = prior ? joinAway(prior, fresh) : fresh;
    absences.set(playerId, { prior, base: before.clock, last: away });
    return away;
  };

  /** What a change answers with: the save it just wrote, already advanced to now (session 37: it was
   *  read again, advanced again and recorded again); a request seen before reads the save as it is now. */
  const after = async (playerId: string, written: SaveDoc | null, t: number): Promise<GameResponse> => {
    if (!written) return ctx.queue.run(playerId, () => current(playerId));
    noteVisit(ctx, playerId, t);
    return { state: written.state, now: t, away: null };
  };

  /** After a change: tell the player's open pages, and record what happened. */
  const announce = (playerId: string, doc: SaveDoc, events: GameEvent[], at: number) =>
    announceChange(ctx, playerId, doc, events, at);

  /** Reads come at a pace: a page reads a few times a minute, a script reading without pause is held. */
  const reading = (reply: FastifyReply, playerId: string) =>
    limit(ctx, reply, `read:${playerId}`, ctx.config.readsPerMinute, 60_000);

  contractRoute(
    app,
    ROUTES.game,
    async ({ req, reply }) => {
      reading(reply, req.playerId!);
      // A page open for weeks reads the game again as it reconnects: its cookie is kept too (session 157).
      keepCookie(ctx, reply, req.cookies[SESSION_COOKIE]!);
      return ctx.queue.run(req.playerId!, () => current(req.playerId!, true));
    },
    requirePlayer(ctx),
  );

  contractRoute(
    app,
    ROUTES.notices,
    ({ req, reply }) => {
      reading(reply, req.playerId!);
      return { notices: ctx.notices.list(req.playerId!) } satisfies NoticesResponse;
    },
    requirePlayer(ctx),
  );

  contractRoute(
    app,
    ROUTES.hiscores,
    async ({ req, reply }) => {
      reading(reply, req.playerId!);
      // Your own entry as of now, even if the save was last written a while ago.
      const at = now();
      await ctx.queue.run(req.playerId!, () => hear(ctx, req.playerId!, at));
      const season = seasonLadderAt(at);
      return {
        online: ctx.live.online,
        listed: ctx.hiscores.isListed(req.playerId!),
        ladders: [
          ctx.hiscores.ladder(TOTAL, req.playerId!),
          // This season's ladder (session 165), named for what it is, whichever season it is.
          ...(season ? [{ ...ctx.hiscores.ladder(season, req.playerId!), skill: SEASON }] : []),
          ...allSkills().map((skill) => ctx.hiscores.ladder(skill, req.playerId!)),
          castlesLadder(ctx.db, req.playerId!),
        ],
      } satisfies HiscoresResponse;
    },
    requirePlayer(ctx),
  );

  contractRoute<{ requestId: string; command: Command }>(
    app,
    ROUTES.command,
    async ({ req, reply, input }) => {
      const player = req.playerId!;
      limit(ctx, reply, `command:${player}`, 30, 10_000);
      const t = now();
      let events: GameEvent[] = [];
      let next: SaveDoc | null = null;
      const out = await handle(ctx.queue, ctx.store, player, input.requestId, t, (doc) => {
        const state = withCastle(ctx, player, doc.state, t);
        const r = ctx.engine.command(state, t, input.command, seeded(state.seed));
        events = r.events;
        next = { ...doc, state: r.state };
        return { doc: next, result: r.result };
      });
      // Announced only once the change is written, and only the first time this request id is seen.
      if (!out.duplicate && next) announce(player, next, events, t);
      return {
        result: out.result,
        duplicate: out.duplicate,
        events,
        ...(await after(player, out.duplicate ? null : next, t)),
      } satisfies ActResponse;
    },
    requirePlayer(ctx),
  );

  for (const f of features) {
    for (const [name, route] of Object.entries(f.routes)) {
      contractRoute<{ requestId: string; input: unknown }>(
        app,
        {
          id: `${f.id}.${name}`,
          method: 'POST',
          path: featurePath(f.id, name),
          auth: 'player',
          input: FeatureRequest,
          example: null,
        },
        async ({ req, reply, input }) => {
          const player = req.playerId!;
          if (!ctx.config.flags[f.id]) throw fail(404, 'notFound');
          limit(ctx, reply, `command:${player}`, 30, 10_000);
          const parsed = route.input.safeParse(input.input);
          if (!parsed.success)
            throw fail(400, 'invalidInput', { fields: parsed.error.issues.map((i) => ['input', ...i.path].join('.')) });
          const t = now();
          let events: GameEvent[] = [];
          let next: SaveDoc | null = null;
          const out = await handle(ctx.queue, ctx.store, player, input.requestId, t, (doc) => {
            const state = withCastle(ctx, player, doc.state, t);
            // A route the page sends by itself is time passing, not the player's input (session 147).
            const arrived = route.passive
              ? ctx.engine.advance(state, Math.max(t, state.clock), seeded(state.seed))
              : ctx.engine.input(state, t, seeded(state.seed));
            const ran = route.run(arrived.state, parsed.data, t);
            events = [...arrived.events, ...(ran.events ?? [])];
            next = { ...doc, state: ran.state };
            return { doc: next, result: ran.result };
          });
          if (!out.duplicate && next) announce(player, next, events, t);
          return {
            result: out.result,
            duplicate: out.duplicate,
            events,
            ...(await after(player, out.duplicate ? null : next, t)),
          } satisfies ActResponse;
        },
        requirePlayer(ctx),
      );
    }
  }

  // The live channel. A page that is not signed in is closed at once with code 4401.
  const who = identify(ctx);
  const opening = async (req: FastifyRequest, reply: FastifyReply) => {
    const r = ctx.limiter.take(`live:${ipOf(req)}`, ctx.config.pagesPerMinute, 60_000, now());
    if (!r.ok)
      await reply
        .code(429)
        .header('retry-after', String(Math.ceil(r.retryAfterMs / 1000)))
        .send();
  };
  app.get(LIVE_PATH, { websocket: true, preValidation: opening }, (socket, req) => {
    try {
      who(req);
    } catch {
      req.playerId = null;
    }
    const player = req.playerId;
    if (!player) return socket.close(4401, 'not signed in');
    ctx.live.add(player, socket, tokenHash(req.cookies[SESSION_COOKIE] ?? ''));
    // Back: nothing waits for them. Their last page closed: their absence is foreseen (session 171).
    ctx.push.back(player);
    socket.on('close', () => {
      ctx.live.remove(player, socket);
      if (!ctx.live.has(player)) ctx.push.gone(player);
    });
    socket.on('message', () => undefined);
  });
}
