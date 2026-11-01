// Castle Clash's routes: read your castle (synced, with the war chest and your reports, names resolved),
// list today's targets, open your castle, and act on it. Reads go at the read pace, changes at the
// command pace, every change once per request id (service.ts).
import { CASTLE_ROUTES, type CastleAction } from '@idle-clash/contracts';
import { castleEngine as E, totalLevel } from '@idle-clash/features';
import type { FastifyInstance } from 'fastify';
import { requirePlayer } from '../auth/routes.ts';
import { limit, type Ctx } from '../context.ts';
import { announce } from '../game/announce.ts';
import { contractRoute, fail } from '../http.ts';
import { act, castleRequest, openCastle, type Handled } from './service.ts';
import { CastleStore, type LogEntry } from './store.ts';

/** A report with the other lord named (or null for a departed one). */
export type LogView = LogEntry & { foeName: string | null };

export interface CastleView {
  /** Whether the lord's total level opens Castle Clash. */
  open: boolean;
  castle: E.Castle | null;
  now: number;
  totalLevel: number;
  warChest: number;
  logs: LogView[];
}

export interface TargetsView {
  lords: { id: string; name: string; rating: number }[];
  mercenaries: E.Mercenary[];
}

export function castleView(ctx: Ctx, playerId: string, now: number): CastleView {
  const castles = new CastleStore(ctx);
  const saved = ctx.store.read(playerId, now);
  if (!saved) throw fail(404, 'notFound');
  const level = totalLevel(saved.doc.state);
  const row = castles.read(playerId);
  const logs = row ? castles.logs(playerId) : [];
  const names = castles.names(logs.map((l) => (typeof l.data.foe === 'string' ? l.data.foe : '')));
  return {
    open: E.castleOpen(level),
    castle: row ? E.syncCastle(row, now).castle : null,
    now,
    totalLevel: level,
    warChest: castles.chest(),
    logs: logs.map((l) => ({ ...l, foeName: typeof l.data.foe === 'string' ? (names.get(l.data.foe) ?? null) : null })),
  };
}

/** Up to five lords near your rating (a fresh five each day, nearest first among them), then mercenaries. */
export function targetsView(ctx: Ctx, playerId: string, now: number): TargetsView {
  const castles = new CastleStore(ctx);
  const row = castles.read(playerId);
  if (!row) return { lords: [], mercenaries: [] };
  const c = E.syncCastle(row, now).castle;
  const day = new Date(now).toISOString().slice(0, 10);
  const near = castles.lordsNear(playerId, c.rating, { low: 0.75, high: 1.35 }, now);
  const lords = near
    .map((l) => ({ l, k: E.hash(`${playerId}:${day}:${l.id}`) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 5)
    .map((x) => x.l)
    .sort((a, b) => Math.abs(a.rating - c.rating) - Math.abs(b.rating - c.rating));
  return { lords, mercenaries: E.mercenaries(c, now, 5 - lords.length) };
}

export function castleRoutes(app: FastifyInstance, ctx: Ctx): void {
  const now = () => ctx.config.now();
  const reading = (reply: Parameters<typeof limit>[1], player: string) =>
    limit(ctx, reply, `read:${player}`, ctx.config.readsPerMinute, 60_000);
  const after = (player: string, out: Handled, at: number) => {
    if (!out.duplicate) announce(ctx, player, out.doc, out.events, at);
    return { result: out.result, duplicate: out.duplicate, castle: castleView(ctx, player, at) };
  };

  contractRoute(
    app,
    CASTLE_ROUTES.castle,
    async ({ req, reply }) => {
      reading(reply, req.playerId!);
      return ctx.queue.run(req.playerId!, () => castleView(ctx, req.playerId!, now()));
    },
    requirePlayer(ctx),
  );

  contractRoute(
    app,
    CASTLE_ROUTES.castleTargets,
    async ({ req, reply }) => {
      reading(reply, req.playerId!);
      return ctx.queue.run(req.playerId!, () => targetsView(ctx, req.playerId!, now()));
    },
    requirePlayer(ctx),
  );

  contractRoute<{ requestId: string }>(
    app,
    CASTLE_ROUTES.castleOpen,
    async ({ req, reply, input }) => {
      const player = req.playerId!;
      limit(ctx, reply, `command:${player}`, 30, 10_000);
      const t = now();
      const out = await castleRequest(ctx, player, input.requestId, t, openCastle);
      return after(player, out, t);
    },
    requirePlayer(ctx),
  );

  contractRoute<{ requestId: string; action: CastleAction }>(
    app,
    CASTLE_ROUTES.castleAct,
    async ({ req, reply, input }) => {
      const player = req.playerId!;
      limit(ctx, reply, `command:${player}`, 30, 10_000);
      const t = now();
      const out = await castleRequest(ctx, player, input.requestId, t, (io) => act(io, input.action));
      return after(player, out, t);
    },
    requirePlayer(ctx),
  );
}
