// The routes for notices while away (session 171): the server's public key, and switching notices on and
// off in a browser. An endpoint that is not a browser's push service is refused.
import { PUSH_ROUTES, pushEndpointAllowed, type PushKeyResponse } from '@idle-clash/contracts';
import type { FastifyInstance } from 'fastify';
import { requirePlayer } from '../auth/routes.ts';
import { limit, type Ctx } from '../context.ts';
import { contractRoute, fail } from '../http.ts';
import { knownZone } from './clock.ts';
import { keysOf } from './send.ts';

export function pushRoutes(app: FastifyInstance, ctx: Ctx): void {
  const player = requirePlayer(ctx);

  contractRoute(app, PUSH_ROUTES.pushKey, () => ({ key: keysOf(ctx.db).publicKey }) satisfies PushKeyResponse, player);

  contractRoute<{ endpoint: string; keys: { p256dh: string; auth: string }; tz: string }>(
    app,
    PUSH_ROUTES.pushOn,
    ({ req, reply, input }) => {
      limit(ctx, reply, `push:${req.playerId!}`, 10, 3_600_000);
      if (!pushEndpointAllowed(input.endpoint)) throw fail(400, 'invalidInput', { fields: ['endpoint'] });
      if (!knownZone(input.tz)) throw fail(400, 'invalidInput', { fields: ['tz'] });
      ctx.push.subscribe(req.playerId!, { endpoint: input.endpoint, keys: input.keys }, input.tz);
      return reply.code(204).send();
    },
    player,
  );

  contractRoute<{ endpoint: string }>(
    app,
    PUSH_ROUTES.pushOff,
    ({ req, reply, input }) => {
      ctx.push.unsubscribe(req.playerId!, input.endpoint);
      return reply.code(204).send();
    },
    player,
  );
}
