// Castle Clash in the rest of the game (DESIGN.md section 7): the Sovereign Edict's bonus, mirrored into
// the save as `features.castle` so the pure engine can play time away from the save alone. The server
// writes it from the castle's row in every request of the owner's; each skill and every fight reads it
// here. `until` is when upkeep would take the treasury under its requirement (at the fullest rate), so an
// edict never outlives its gold while its lord is away.
import type { State } from '@idle-clash/kernel';
import { ECONOMY, EDICTS } from '@idle-clash/content';
import { z } from 'zod';
import type { Castle } from './castle.ts';
import { avgLevel, edictBonusPct, requiredTreasury } from './economy.ts';

const Count = z.number().int().min(0).max(1e9);
/** The castle's standing, for the deeds that read it (session 33): its average level (whole), fortresses
 *  taken, war marks earned, relic levels forged and War College ranks studied. */
export const CastleStanding = z
  .object({
    level: Count,
    taken: Count,
    marks: Count,
    relics: Count,
    studies: Count,
    /** The most tempers on any one relic. */
    tempered: Count.optional(),
    /** The day of the last Call to arms answered, for the Hearth's reminder. */
    called: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
  })
  .strict();
export type CastleStanding = z.infer<typeof CastleStanding>;

export const CastleMirror = z
  .object({
    edict: z.enum(['harvest', 'vigor', 'fortune']).nullable(),
    /** The edict's bonus in percent (5 to 10, more with excavation). */
    pct: z.number().min(0).max(50),
    until: z.number(),
    standing: CastleStanding.optional(),
  })
  .strict();
export type CastleMirror = z.infer<typeof CastleMirror>;

export const NO_EDICT: CastleMirror = { edict: null, pct: 0, until: 0 };

/** The mirror in a save; a part that does not read is no edict. */
export function mirrorOf(state: State): CastleMirror {
  const raw = Object.hasOwn(state.features, 'castle') ? state.features.castle : undefined;
  const parsed = CastleMirror.safeParse(raw);
  return parsed.success ? parsed.data : NO_EDICT;
}

/** Whether a lord with a castle has yet to answer today's Call to arms, as their save last heard. */
export const callAwaits = (state: State, now: number): boolean => {
  const standing = mirrorOf(state).standing;
  return !!standing && standing.called !== new Date(now).toISOString().slice(0, 10);
};

/** A lord's castle standing as their save holds it, or null before their castle is raised. */
export const castleStanding = (state: State): CastleStanding | null => mirrorOf(state).standing ?? null;

/** What the deeds read of a castle. */
export function standingOf(c: Castle): CastleStanding {
  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  return {
    level: Math.floor(avgLevel(c)),
    taken: Math.max(0, c.incursionTier - 1),
    marks: Math.floor(c.warMarksEarned),
    relics: sum(c.relics),
    studies: sum(c.techs),
    tempered: Math.max(0, ...Object.values(c.tempers)),
    called: c.lastCtaDateUtc,
  };
}

/** The bonus an edict gives at a moment to what it lifts: XP, finds or fight gold. */
export function edictPct(state: State, at: number, lifts: 'xp' | 'finds' | 'fightGold'): number {
  const m = mirrorOf(state);
  if (!m.edict || at >= m.until) return 0;
  return EDICTS.find((e) => e.id === m.edict)?.lifts === lifts ? m.pct : 0;
}

/** The mirror a castle gives its lord now: no edict when none is chosen or the treasury is short; else its
 *  bonus, until the moment upkeep (2% a day, compounding, while not paused) takes the treasury under the
 *  requirement. Paused upkeep keeps the edict until the lord's next Call to arms rewrites the mirror. */
export function mirrorFor(c: Castle, totalLevel: number, now: number): CastleMirror {
  const pct = edictBonusPct(c, totalLevel);
  const standing = standingOf(c);
  if (!c.edict || pct <= 0) return { ...NO_EDICT, standing };
  const req = requiredTreasury(c, totalLevel);
  const days = Math.log(req / c.treasury) / Math.log(1 - ECONOMY.UPKEEP_PER_DAY);
  const crossing = now + Math.max(0, days) * 86_400_000;
  const pauseAt = c.lastCtaDateUtc
    ? Date.parse(`${c.lastCtaDateUtc}T00:00:00Z`) + ECONOMY.UPKEEP_PAUSE_MS
    : Number.NEGATIVE_INFINITY;
  const until = crossing <= pauseAt ? crossing : Number.MAX_SAFE_INTEGER;
  return { edict: c.edict as CastleMirror['edict'], pct, until: Math.floor(until), standing };
}
