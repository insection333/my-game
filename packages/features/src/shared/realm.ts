// The realm's boss of the week (session 174): one of the three bosses is the realm's each week, and every
// player fights it once a day from the Combat lane, at their own measure: the realm's version of it is the
// strongest foe they fare well against, with a boss's health. A win is a strike; the server counts the
// realm's strikes (the save holds only its own) and, when the week's are enough, the boss falls and everyone
// who struck takes a share. The server tells the save how the realm's week stands (`features.realm`,
// written before each request, as the castle is), so the page and the rules read it.
import type { State } from '@idle-clash/kernel';
import { z } from 'zod';
import { FOES, type Foe } from './combat/data.ts';
import { oddsFor } from './combat/odds.ts';
import { BOSSES, type Boss } from './expeditions/data.ts';
import { skillLevel } from './skill.ts';

const DAY = 86_400_000;
/** The realm's boss has a boss's health: this many times the foe it is measured from. */
export const REALM_HP = 4;
/** A strike pays this many times the foe's gold, and marks. */
export const REALM_GOLD = 4;
export const REALM_MARKS = 2;
/** A share of a fallen boss: marks, and gold as so many strikes'. */
export const REALM_SHARE_MARKS = 10;
export const REALM_SHARE_STRIKES = 10;
/** Strikes the week asks for each player who played last week, and the least it asks. */
export const REALM_PER_PLAYER = 4;
export const REALM_LEAST = 8;

/** The Monday a moment's week began (UTC), as the week's contract and the realm's boss reckon it. */
export function weekOf(at: number): string {
  const d = new Date(at);
  const back = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back)).toISOString().slice(0, 10);
}

/** The boss that is the realm's in a week: the three in turn. */
export function realmBossIn(week: string): Boss {
  const n = Math.round(Date.parse(`${week}T00:00:00Z`) / (7 * DAY));
  return BOSSES[((n % BOSSES.length) + BOSSES.length) % BOSSES.length];
}

/** How the realm's week stands, as the server tells the save. */
export const RealmMirror = z
  .object({
    week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    needed: z.number().int().nonnegative(),
    strikes: z.number().int().nonnegative(),
    mine: z.number().int().nonnegative(),
    fell: z.boolean(),
    /** A fallen boss this player struck, this week or last, whose share they may take. */
    owed: z
      .object({ week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), boss: z.string().max(64) })
      .strict()
      .nullable(),
  })
  .strict();
export type RealmMirror = z.infer<typeof RealmMirror>;

/** The realm's week as the server last told it; null where it has not (a test's save, the simulation). */
export function realmOf(state: State): RealmMirror | null {
  const r = RealmMirror.safeParse(state.features.realm);
  return r.success ? r.data : null;
}

/** A foe as the realm's boss: a boss's health, in the realm boss's name. */
function asRealm(base: Foe, at: number): Foe {
  const boss = realmBossIn(weekOf(at));
  return { ...base, id: `realm:${boss.id}:${base.id}`, hp: base.hp * REALM_HP, gold: base.gold * REALM_GOLD };
}

/** The realm's boss at this player's measure: made from the strongest foe open to them whose realm's version
 *  (four times the health) they still fare well against (Easy or Fair), so the boss is one they can beat
 *  (session 181: measured from the foe itself, a player three weeks in met it "Too strong"); else from the
 *  weakest. Null for a player who cannot fight. */
export function realmFoe(state: State, at: number): Foe | null {
  const hp = skillLevel(state, 'hitpoints');
  const open = FOES.filter((f) => f.hitpoints <= hp);
  if (!open.length) return null;
  let base: Foe | null = null;
  for (const f of open) {
    const o = oddsFor(state, asRealm(f, at));
    if (!o) return null;
    if (o.verdict === 'easy' || o.verdict === 'fair') base = f;
  }
  return asRealm(base ?? open[0], at);
}
