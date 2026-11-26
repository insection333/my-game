// The bounty board (session 175): each day three bounties on foes the player fares well against, each about
// an hour of fights, one taken at a time and done by fighting that foe in the Combat lane as they would; a
// bounty done pays marks and gold. Once a combat style is at 99 some bounties are on elite foes: the same foe
// with harder hits and more health (the warband's twist, and a boss's toughness), finds twice as likely,
// fought while the bounty is held, so the lane, the arena and Your odds all meet the elite alike.
import { seeded, type State } from '@idle-clash/kernel';
import { z } from 'zod';
import { FOES, HITPOINTS, type Foe } from './combat/data.ts';
import { doneCount } from './given.ts';
import { partReader } from './part.ts';
import { skillLevel } from './skill.ts';

const Key = z.string().max(64);
const Count = z.number().int().nonnegative();
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const Bounty = z.object({ foe: Key, count: Count, elite: z.boolean() }).strict();
export type Bounty = z.infer<typeof Bounty>;

export const BountyState = z
  .object({
    /** The bounty held: its foe, its count, the foe's wins when it was taken, and (session 183) the wins
     *  over it in the Combat lane's own fights since, which are what count (an expedition's fights of the
     *  foe met it at its usual strength, an elite bounty's too). Older bounties count from `base`. */
    taken: Bounty.extend({ base: Count, day: Day, at: z.number().nonnegative(), won: Count.optional() })
      .strict()
      .nullable(),
    /** The day's bounties already taken (each offer once a day). */
    day: Day.nullable(),
    took: z.array(Key).max(3),
    /** Bounties done in all, and on elite foes. */
    done: Count,
    elites: Count,
  })
  .strict();
export type BountyState = z.infer<typeof BountyState>;

export const bountyOf: (state: State) => BountyState = partReader('bounty', BountyState, {
  taken: null,
  day: null,
  took: [],
  done: 0,
  elites: 0,
});
export const setBounty = (state: State, b: BountyState): void => {
  state.features.bounty = b;
};

/** An elite foe: hits 15% harder, half again its health. */
export const ELITE = { HIT: 1.15, HP: 1.5, FINDS: 2 } as const;
/** A bounty's marks (elite twice), and its gold as so many of the foe's fights. */
export const BOUNTY_MARKS = 5;
export const BOUNTY_GOLD_FIGHTS = 1;
/** Offers a day. */
export const BOUNTY_OFFERS = 3;

export const dayOf = (at: number): string => new Date(at).toISOString().slice(0, 10);

/** Wins against a foe so far: its mastery count, less what Rare finds gave it (session 181: one find made
 *  500 wins and finished any bounty at once). */
export const winsOver = (state: State, foe: string): number => doneCount(state, `combat:${foe}`);

/** The wins counted towards the bounty held: the lane's fights of its foe since it was taken. */
export function bountyWins(state: State): number {
  const t = bountyOf(state).taken;
  if (!t) return 0;
  return Math.max(0, t.won ?? winsOver(state, t.foe) - t.base);
}

/** A win in the Combat lane's own fight of a foe, begun at `startedAt`: counted towards the bounty held on
 *  it, if it was taken before the fight began. */
export function countBountyWin(state: State, foe: string, startedAt: number): void {
  const b = bountyOf(state);
  const t = b.taken;
  if (!t || t.foe !== foe || t.at > startedAt) return;
  setBounty(state, { ...b, taken: { ...t, won: bountyWins(state) + 1 } });
}

/** The elite bounty held on this foe, if any, not yet done; for a fight begun at `startedAt`, one taken
 *  before it began (a fight under way when the bounty is taken is fought as it began). */
export function eliteHeld(state: State, foe: string, startedAt = Infinity): boolean {
  const t = bountyOf(state).taken;
  return !!t && t.elite && t.foe === foe && t.at <= startedAt && bountyWins(state) < t.count;
}

/** A foe as it is fought: elite while an elite bounty on it is held. */
export function asFought(state: State, foe: Foe, startedAt = Infinity): Foe {
  if (!eliteHeld(state, foe.id, startedAt)) return foe;
  return { ...foe, hp: Math.round(foe.hp * ELITE.HP), maxHit: Math.round(foe.maxHit * ELITE.HIT) };
}

/** Whether a combat style stands at 99, opening elite bounties. */
export const elitesOpen = (state: State): boolean =>
  ['melee', 'archery', 'magic'].some((s) => skillLevel(state, s) >= 99);

/** The day's three bounties, drawn from the foes open to the player that `fair` says they fare well against,
 *  each about an hour of fights (`secondsPerFight`); the top region's foes elite half the time once open. */
export function offersFor(state: State, now: number, fair: (foe: Foe) => { secondsPerFight: number } | null): Bounty[] {
  const hp = skillLevel(state, HITPOINTS);
  const pool = FOES.filter((f) => f.hitpoints <= hp).flatMap((f) => {
    const o = fair(f);
    return o ? [{ foe: f, seconds: o.secondsPerFight }] : [];
  });
  const day = dayOf(now);
  const r = seeded(state.seed);
  const n = Number(day.replaceAll('-', ''));
  // The strongest first, then a draw among the rest, so the day's three are worth fighting.
  const best = [...pool].sort((a, b) => b.foe.level - a.foe.level);
  const picks = best.slice(0, 1);
  const rest = best.slice(1);
  while (picks.length < BOUNTY_OFFERS && rest.length) {
    const i = Math.floor(r('bounty', n + picks.length) * rest.length);
    picks.push(rest.splice(i, 1)[0]);
  }
  const elites = elitesOpen(state);
  return picks.map((p, i) => ({
    foe: p.foe.id,
    count: Math.max(5, Math.round(3600 / Math.max(1, p.seconds) / 5) * 5),
    elite: elites && p.foe.tier >= 7 && r('bounty-elite', n + i) < 0.5,
  }));
}

