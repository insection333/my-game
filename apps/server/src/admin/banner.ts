// The realm's banner (session 235): a line from the keepers of the realm put up from the console, shown to
// every player across the top of the game until its time runs out or an admin takes it down. Kept in the
// server's settings, so it stands across a restart, and in memory, as every page read asks for it; told at
// once to every page open, and each put up or taken down is in the Audit log.
import { ROUTES, type Banner, type BannerView } from '@idle-clash/contracts';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth/routes.ts';
import type { Ctx } from '../context.ts';
import { players, serverSettings } from '../db/schema.ts';
import { contractRoute } from '../http.ts';
import { audit } from './audit.ts';
import { onceAtATime } from './target.ts';

const KEY = 'banner';
const HOUR = 3_600_000;
/** Each server's banner as last read or written (undefined until then). */
const kept = new WeakMap<Ctx, BannerView | null>();
const keptOf = (ctx: Ctx, b: BannerView | null) => kept.set(ctx, b);

function storedOf(ctx: Ctx): BannerView | null {
  if (kept.has(ctx)) return kept.get(ctx)!;
  const row = ctx.db.select().from(serverSettings).where(eq(serverSettings.key, KEY)).get();
  const was = row ? (JSON.parse(row.value) as BannerView) : null;
  kept.set(ctx, was);
  return was;
}

/** The banner standing now, as the console shows it: null once its time has run out. */
export function bannerView(ctx: Ctx, now: number): BannerView | null {
  const b = storedOf(ctx);
  return b && b.until > now ? b : null;
}

/** The banner standing now, as a player's page holds it. */
export function bannerNow(ctx: Ctx, now: number): Banner | null {
  const b = bannerView(ctx, now);
  return b ? { id: b.id, text: b.text, until: b.until } : null;
}

function put(ctx: Ctx, b: BannerView | null): void {
  if (b)
    ctx.db
      .insert(serverSettings)
      .values({ key: KEY, value: JSON.stringify(b) })
      .onConflictDoUpdate({ target: serverSettings.key, set: { value: JSON.stringify(b) } })
      .run();
  else ctx.db.delete(serverSettings).where(eq(serverSettings.key, KEY)).run();
  kept.set(ctx, b);
  const banner = b ? { id: b.id, text: b.text, until: b.until } : null;
  for (const id of ctx.live.players()) ctx.live.publish(id, { type: 'banner', banner });
}

/** An admin's account gone (session 238): the banner they put up stays, no longer naming them, as their
 *  entries in the log no longer do. */
export function forgetBannerActor(ctx: Ctx, name: string): void {
  const b = storedOf(ctx);
  if (!b || b.actor !== name) return;
  const nameless = { ...b, actor: '' };
  ctx.db
    .update(serverSettings)
    .set({ value: JSON.stringify(nameless) })
    .where(eq(serverSettings.key, KEY))
    .run();
  keptOf(ctx, nameless);
}

export function bannerRoutes(app: FastifyInstance, ctx: Ctx): void {
  const admin = requireAdmin(ctx);
  const claim = onceAtATime();
  contractRoute<{ text: string; hours: number }>(
    app,
    ROUTES.adminBanner,
    ({ req, input }) => {
      const now = ctx.config.now();
      // A double press puts one banner up (session 236: it put up two, telling every page twice).
      const standing = bannerView(ctx, now);
      if (!claim(req.playerId!, `banner:${input.text}:${input.hours}`, now) && standing) return standing;
      const actor =
        ctx.db.select({ name: players.name }).from(players).where(eq(players.id, req.playerId!)).get()?.name ?? '';
      // Its id is the moment it went up, kept above the last one's so a banner put up again shows afresh.
      const id = Math.max(now, (storedOf(ctx)?.id ?? 0) + 1);
      const b: BannerView = { id, text: input.text, until: now + input.hours * HOUR, actor };
      put(ctx, b);
      audit(ctx, req, 'banner', null, { text: input.text, hours: input.hours });
      return b;
    },
    admin,
  );
  contractRoute(
    app,
    ROUTES.adminBannerDown,
    ({ req, reply }) => {
      if (bannerView(ctx, ctx.config.now())) {
        put(ctx, null);
        audit(ctx, req, 'bannerDown', null);
      } else if (storedOf(ctx)) {
        // One whose time ran out is let go quietly: no page shows it, and none needs telling.
        ctx.db.delete(serverSettings).where(eq(serverSettings.key, KEY)).run();
        kept.set(ctx, null);
      }
      return reply.code(204).send();
    },
    admin,
  );
}
