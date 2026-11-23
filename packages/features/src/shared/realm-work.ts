// The realm's work of the season (session 218, the plan *Dead and short content, 23 November*): each season
// the realm raises one shared work (a beacon on the hill, a bridge over the Fen, a great hall, in turn), every
// player giving gold and materials of any tier (their price), in five stages. Contributions are not a ladder:
// every giver shares the finished work alike, as the realm's boss's strikers do. The server counts the gifts
// (each save's `realmGiven` events) and writes how the work stands into each save before the engine runs, as it
// does the realm's boss; the work asks a share for each player who gave the season before, so a realm of one
// can finish it. Gold in year two piled up with nothing to buy; this is where it goes, together.
import type { State } from '@idle-clash/kernel';
import { z } from 'zod';
import { partReader } from './part.ts';

export const REALM_WORK = {
  STAGES: 5,
  /** The worth asked for each player who gave the season before, and the least asked of any realm. */
  PER_GIVER: 40_000_000,
  LEAST: 40_000_000,
} as const;

export const REALM_WORKS = ['beacon', 'bridge', 'great-hall'] as const;
export type RealmWorkId = (typeof REALM_WORKS)[number];
/** The work of a season: the three in turn. */
export const realmWorkIn = (season: number): RealmWorkId => REALM_WORKS[(season - 1) % REALM_WORKS.length];

const Name = z.string().min(1).max(32);
export const RealmWorkMirror = z
  .object({
    season: z.number().int().positive(),
    work: z.enum(REALM_WORKS),
    /** The worth the whole work asks, and what the realm has given. */
    needed: z.number().int().positive(),
    given: z.number().int().nonnegative(),
    /** This player's own gifts this season, and the players who have given. */
    mine: z.number().int().nonnegative(),
    givers: z.number().int().nonnegative(),
    /** Works finished with this player's part, all told. */
    finished: z.number().int().nonnegative(),
    /** The last work finished with this player's part: its season and work, and those who raised it. */
    thanks: z
      .object({
        season: z.number().int().positive(),
        work: z.enum(REALM_WORKS),
        names: z.array(Name).max(5),
        more: z.number().int().nonnegative(),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type RealmWorkMirror = z.infer<typeof RealmWorkMirror>;

/** How the realm's work stands in this save, as the server last wrote it; null without a server. */
export const realmWorkOf: (state: State) => RealmWorkMirror | null = partReader(
  'realmWork',
  RealmWorkMirror.nullable(),
  null,
);

/** The stage a work stands at, 0 to 5. */
export const workStage = (m: Pick<RealmWorkMirror, 'given' | 'needed'>): number =>
  Math.min(REALM_WORK.STAGES, Math.floor((m.given * REALM_WORK.STAGES) / m.needed));
