// What every route can reach. Built once in app.ts; tests build it with their own clock and mailer.
import type { Engine, PlayerQueue } from '@idle-clash/kernel';
import type { SqliteStore } from '@idle-clash/kernel/store';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Sessions } from './auth/sessions.ts';
import type { Mailer } from './auth/mailer.ts';
import type { Config } from './config.ts';
import type { LiveHub } from './game/live.ts';
import { fail } from './http.ts';
import type { RateLimiter } from './security.ts';
import type { Telemetry } from './telemetry.ts';

export interface Ctx {
  config: Config;
  db: BetterSQLite3Database;
  store: SqliteStore;
  queue: PlayerQueue;
  engine: Engine;
  sessions: Sessions;
  limiter: RateLimiter;
  mailer: Mailer;
  live: LiveHub;
  telemetry: Telemetry;
}

declare module 'fastify' {
  interface FastifyRequest {
    playerId: string | null;
  }
}

/** Refuses the request, with Retry-After, once a key has been tried too often in its window. */
export function limit(ctx: Ctx, reply: FastifyReply, key: string, max: number, windowMs: number): void {
  const r = ctx.limiter.take(key, max, windowMs, ctx.config.now());
  if (!r.ok) {
    const retryAfterSeconds = Math.ceil(r.retryAfterMs / 1000);
    reply.header('retry-after', String(retryAfterSeconds));
    throw fail(429, 'tooManyTries', { retryAfterSeconds });
  }
}

/** The client's address as the proxy in front of the server reports it. */
export const ipOf = (req: FastifyRequest) => req.ip;
