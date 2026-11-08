// A player's profile card (session 44): their look and title, their career read from their save, and
// their castle with its war record. Anyone signed in may look up anyone not banned, by name; each card is
// kept for a minute, so a crowd opening one player's card reads their save once.
import { PROFILE_ROUTES, nameKey, type Profile } from '@idle-clash/contracts';
import { careerOf, shownHonours } from '@idle-clash/features';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requirePlayer } from '../auth/routes.ts';
import { withCastle } from '../castle/mirror.ts';
import { recordOf } from '../castle/record.ts';
import { limit, type Ctx } from '../context.ts';
import { playerBastions, players } from '../db/schema.ts';
import { contractRoute, fail } from '../http.ts';

const KEPT_MS = 60_000;
const DAY = 86_400_000;

/** A player's card as others see it, or null if there is no such player (or they are banned). */
export function profileOf(ctx: Ctx, name: string, now: number): (Omit<Profile, 'you'> & { id: string }) | null {
  const p = ctx.db
    .select({ id: players.id, name: players.name, createdAt: players.createdAt, bannedAt: players.bannedAt })
    .from(players)
    .where(eq(players.nameKey, nameKey(name)))
    .get();
  if (!p || p.bannedAt !== null) return null;
  const saved = ctx.store.read(p.id, now);
  if (!saved) return null;
  // As the game reads it: with their castle's standing mirrored in.
  const state = withCastle(ctx, p.id, saved.doc.state, now);
  const shown = shownHonours(state);
  const { castle, ...career } = careerOf(state, now);
  const bastion = ctx.db
    .select({ rating: playerBastions.bastionRating })
    .from(playerBastions)
    .where(eq(playerBastions.userId, p.id))
    .get();
  const record = recordOf(ctx.db, p.id);
  const none = {
    siegesWon: 0,
    siegesLost: 0,
    defencesHeld: 0,
    defencesLost: 0,
    strongholdsTaken: 0,
    strongholdsHeld: 0,
    spiesDone: 0,
    spiesCaught: 0,
    spiesStopped: 0,
  };
  return {
    id: p.id,
    name: p.name,
    since: Math.max(0, Math.floor((now - p.createdAt) / DAY)),
    title: shown.title,
    banner: shown.banner,
    look: { picture: shown.picture, frame: shown.frame, glow: shown.glow, badge: shown.badge, scene: shown.scene },
    career,
    places: ctx.hiscores.placesOf(p.id),
    castle:
      castle && bastion
        ? {
            level: castle.level,
            rating: bastion.rating,
            fortresses: castle.fortresses,
            routs: castle.routs,
            ...none,
            ...record,
          }
        : null,
  };
}

export function profileRoutes(app: FastifyInstance, ctx: Ctx): void {
  const kept = new Map<string, { at: number; card: ReturnType<typeof profileOf> }>();
  contractRoute<{ name: string }>(
    app,
    PROFILE_ROUTES.profile,
    ({ req, reply, input }) => {
      const asker = req.playerId!;
      limit(ctx, reply, `profile:${asker}`, 60, 60_000);
      const now = ctx.config.now();
      const key = nameKey(input.name);
      let hit = kept.get(key);
      if (!hit || now - hit.at > KEPT_MS) {
        hit = { at: now, card: profileOf(ctx, input.name, now) };
        kept.set(key, hit);
        // Kept only while fresh: the map never holds more than a minute's lookups.
        for (const [k, v] of kept) if (now - v.at > KEPT_MS) kept.delete(k);
      }
      if (!hit.card) throw fail(404, 'notFound');
      const { id, ...card } = hit.card;
      return { ...card, you: id === asker } satisfies Profile;
    },
    requirePlayer(ctx),
  );
}
