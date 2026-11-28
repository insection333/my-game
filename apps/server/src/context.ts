// What every route can reach. Built once in app.ts; tests build it with their own clock and mailer.
import type { Engine, PlayerQueue } from '@idle-clash/kernel';
import type { SqliteStore } from '@idle-clash/kernel/store';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { isIPv6 } from 'node:net';
import type { Sessions } from './auth/sessions.ts';
import type { Mailer } from './auth/mailer.ts';
import type { Config } from './config.ts';
import type { LiveHub } from './game/live.ts';
import type { Hiscores } from './game/hiscores.ts';
import type { Notices } from './game/notices.ts';
import type { Push } from './push/push.ts';
import type { Realm } from './game/realm.ts';
import type { RealmWorks } from './game/realm-works.ts';
import type { Social } from './game/social.ts';
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
  notices: Notices;
  hiscores: Hiscores;
  /** Notices while away (session 171). */
  push: Push;
  /** The realm's boss of the week (session 174). */
  realm: Realm;
  /** The realm's work of the season (session 218). */
  realmWorks: RealmWorks;
  /** Cheers and gifts between players (session 254). */
  social: Social;
}

declare module 'fastify' {
  interface FastifyRequest {
    playerId: string | null;
    /** Whether the signed-in account is the admin console's own (session 227). */
    staff: boolean;
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

/** The network a request comes from, as the limits count it (session 290): an IPv4 address as it is (or
 *  written as IPv6), an IPv6 address by its /64, the least block one home, phone or server is given, any
 *  address of which a single device may take at will; counted by the whole address, one person could
 *  sign up without end or spend a player's sign-in tries from one machine. */
export function networkOf(ip: string): string {
  const bare = ip.split('%')[0];
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(bare);
  if (mapped) return mapped[1];
  if (!isIPv6(bare)) return bare;
  const [head = '', tail] = bare.split('::');
  const groups = (part: string) => (part ? part.split(':').flatMap((g) => (g.includes('.') ? ['0', '0'] : [g])) : []);
  const front = groups(head);
  const back = tail === undefined ? [] : groups(tail);
  const all = [...front, ...Array<string>(Math.max(0, 8 - front.length - back.length)).fill('0'), ...back];
  return `${all
    .slice(0, 4)
    .map((g) => parseInt(g, 16).toString(16))
    .join(':')}::/64`;
}

/** The client's network as the proxy in front of the server reports it (`networkOf`). A request whose
 *  address cannot be read (no socket, as in a test's injected page) counts as one shared address. */
export function ipOf(req: FastifyRequest): string {
  try {
    return networkOf(req.ip);
  } catch {
    return 'unknown';
  }
}
