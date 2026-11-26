// A player's profile card (session 44): opened from their name anywhere (the ladders, Castle Clash's
// reports and accounts, the War, notices). Their look, their title, their career and their war record.
import { z } from 'zod';
import { PlayerName } from './fields.ts';
import { PATHS } from './paths.ts';
import type { Look, RouteContract } from './routes.ts';

export const ProfileRequest = z.object({ name: PlayerName }).strict();

export interface Profile {
  name: string;
  /** Days since they joined. */
  since: number;
  title: string | null;
  banner: string;
  look: Look;
  career: {
    totalLevel: number;
    deedPoints: number;
    deedsDone: number;
    deedsAll: number;
    titles: number;
    kindlings: number;
    defeats: number;
    bossWins: number;
    runs: number;
    /** The deepest depth reached in the Deep (session 226), 0 before the first descent. */
    deepest: number;
    /** Lifetime records (session 242). */
    finds: number;
    findsAll: number;
    bounties: number;
    weeks: number;
    favour: number;
    realmFallen: number;
  };
  /** Their places on the hiscores (session 54), once listed: Total first, then their three best skills,
   *  the best first. */
  places: { skill: string; place: number }[];
  /** Their castle, once raised: its level and rating, fortresses and routs, and their war record. */
  castle: {
    level: number;
    rating: number;
    fortresses: number;
    routs: number;
    /** The season's legendary sieges taken to the last chamber (session 226). */
    legends: number;
    siegesWon: number;
    siegesLost: number;
    defencesHeld: number;
    defencesLost: number;
    strongholdsTaken: number;
    strongholdsHeld: number;
    spiesDone: number;
    spiesCaught: number;
    spiesStopped: number;
  } | null;
  /** Whether this is the asking player's own card (no Report, no Send a message). */
  you: boolean;
  /** Cheers and a gift (session 254), for another's card: what a cheer would be for this week (null when
   *  there is nothing to cheer), whether one may be sent now, and whether a gift may. Null on your own card
   *  and between players where either has blocked the other. */
  social: {
    cheer: { occasion: 'rank' | 'legend' | 'strike'; detail: string; place: number } | null;
    cheerState: SocialState;
    gift: SocialState;
  } | null;
}

/** Whether a cheer or gift may be sent now, or why not: sent to them today, three cheers sent today, a gift
 *  given today, your account under a week old, both made the same week, or theirs full for the day. */
/** Cheers and gifts refused (session 254): nothing to cheer this week, cheered today, three cheers today, a gift
 *  given today, an account under a week old, two made the same week, or the friend's gifts full today. */
export const SOCIAL_REFUSALS = [
  'nothingToCheer',
  'cheerSent',
  'cheersSpent',
  'cheersFull',
  'giftGiven',
  'giftYoung',
  'giftSameWeek',
  'giftFull',
] as const;

export type SocialState = 'open' | 'sent' | 'spent' | 'given' | 'young' | 'sameWeek' | 'full';

const route = (r: RouteContract) => r;
export const PROFILE_ROUTES = {
  profile: route({
    id: 'profile',
    method: 'POST',
    path: PATHS.profile,
    auth: 'player',
    input: ProfileRequest,
    example: { name: 'Rowan' },
  }),
  // Cheers and gifts (session 254).
  cheer: route({
    id: 'cheer',
    method: 'POST',
    path: PATHS.cheer,
    auth: 'player',
    input: ProfileRequest,
    example: { name: 'Rowan' },
  }),
  gift: route({
    id: 'gift',
    method: 'POST',
    path: PATHS.gift,
    auth: 'player',
    input: ProfileRequest,
    example: { name: 'Rowan' },
  }),
} satisfies Record<string, RouteContract>;
