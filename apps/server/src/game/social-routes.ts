// Cheers and gifts on a friend's card (session 254): what the card offers the asker, and the two presses.
import { PROFILE_ROUTES, nameKey, type Profile } from '@idle-clash/contracts';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requirePlayer } from '../auth/routes.ts';
import { limit, type Ctx } from '../context.ts';
import { players } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';

type Who = { id: string; name: string; createdAt: number };

const REFUSED = {
  nothing: 'nothingToCheer',
  sent: 'cheerSent',
  spent: 'cheersSpent',
  given: 'giftGiven',
  young: 'giftYoung',
  sameWeek: 'giftSameWeek',
  full: 'giftFull',
} as const;

const playerById = (ctx: Ctx, id: string): Who | undefined =>
  ctx.db
    .select({ id: players.id, name: players.name, createdAt: players.createdAt })
    .from(players)
    .where(eq(players.id, id))
    .get();

/** Another player by name, as a cheer or gift may reach them: not banned, not the console's account. */
function targetOf(ctx: Ctx, name: string): Who | undefined {
  const p = ctx.db
    .select({
      id: players.id,
      name: players.name,
      createdAt: players.createdAt,
      bannedAt: players.bannedAt,
      role: players.role,
    })
    .from(players)
    .where(eq(players.nameKey, nameKey(name)))
    .get();
  return p && p.bannedAt === null && p.role !== 'staff' ? p : undefined;
}

/** What a friend's card offers the asker: null between players where either has blocked the other. */
export function socialOf(
  ctx: Ctx,
  askerId: string,
  to: { id: string; createdAt: number },
  now: number,
): Profile['social'] {
  const asker = playerById(ctx, askerId);
  if (!asker || ctx.social.blocked(askerId, to.id)) return null;
  return {
    cheer: ctx.social.occasion(to.id, now),
    cheerState: ctx.social.cheerState(askerId, to.id, now),
    gift: ctx.social.giftState(asker, to, now),
  };
}

export function socialRoutes(app: FastifyInstance, ctx: Ctx): void {
  const pressed = (ask: 'cheer' | 'gift') =>
    contractRoute<{ name: string }>(
      app,
      PROFILE_ROUTES[ask],
      ({ req, reply, input }) => {
        const id = req.playerId!;
        limit(ctx, reply, `${ask}:${id}`, 30, 3_600_000);
        const now = ctx.config.now();
        const from = playerById(ctx, id);
        const to = targetOf(ctx, input.name);
        if (!from || !to || to.id === id || ctx.social.blocked(id, to.id)) throw fail(404, 'notFound');
        const said = ask === 'cheer' ? ctx.social.cheer(from, to.id, now) : ctx.social.gift(from, to, now);
        if (said !== 'open') throw fail(409, said === 'full' && ask === 'cheer' ? 'cheersFull' : REFUSED[said]);
        return { ok: true };
      },
      requirePlayer(ctx),
    );
  pressed('cheer');
  pressed('gift');
}
