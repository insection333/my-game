// The game over HTTP: read your state, send a command, call a feature's route, and the live channel.
// Every change runs one at a time per player and acts once per request id (the kernel's `handle`).
import { FeatureRequest, LIVE_PATH, ROUTES, type ActResponse, type GameResponse } from '@idle-clash/contracts';
import type { Feature } from '@idle-clash/features';
import { handle, seeded, type Command, type GameEvent, type SaveDoc } from '@idle-clash/kernel';
import type { FastifyInstance } from 'fastify';
import { limit, type Ctx } from '../context.ts';
import { contractRoute, fail } from '../http.ts';
import { identify, requirePlayer } from '../auth/routes.ts';

export function gameRoutes(app: FastifyInstance, ctx: Ctx, features: readonly Feature[]): void {
  const now = () => ctx.config.now();

  /** Reads a player's save and advances it to now, without writing: what the page should show. */
  const current = (playerId: string): GameResponse => {
    const saved = ctx.store.read(playerId, now());
    if (!saved) throw fail(404, 'notFound');
    const t = now();
    return { state: ctx.engine.advance(saved.doc.state, t, seeded(saved.doc.state.seed)).state, now: t };
  };

  /** After a change: tell the player's open pages, and record what happened. */
  const announce = (playerId: string, doc: SaveDoc, events: GameEvent[], at: number) => {
    ctx.live.publish(playerId, { type: 'state', state: doc.state, now: at });
    if (events.length) ctx.live.publish(playerId, { type: 'events', events });
    ctx.telemetry.events(playerId, events);
  };

  contractRoute(
    app,
    ROUTES.game,
    async ({ req }) => ctx.queue.run(req.playerId!, () => current(req.playerId!)),
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
        const r = ctx.engine.command(doc.state, t, input.command, seeded(doc.state.seed));
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
        ...(await ctx.queue.run(player, () => current(player))),
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
          path: `/api/f/${f.id}/${name}`,
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
            const arrived = ctx.engine.input(doc.state, t, seeded(doc.state.seed));
            events = arrived.events;
            const ran = route.run(arrived.state, parsed.data, t);
            next = { ...doc, state: ran.state };
            return { doc: next, result: ran.result };
          });
          if (!out.duplicate && next) announce(player, next, events, t);
          return {
            result: out.result,
            duplicate: out.duplicate,
            events,
            ...(await ctx.queue.run(player, () => current(player))),
          } satisfies ActResponse;
        },
        requirePlayer(ctx),
      );
    }
  }

  // The live channel. A page that is not signed in is closed at once with code 4401.
  const who = identify(ctx);
  app.get(LIVE_PATH, { websocket: true }, (socket, req) => {
    try {
      who(req);
    } catch {
      req.playerId = null;
    }
    const player = req.playerId;
    if (!player) return socket.close(4401, 'not signed in');
    ctx.live.add(player, socket);
    socket.on('close', () => ctx.live.remove(player, socket));
    socket.on('message', () => undefined);
  });
}
