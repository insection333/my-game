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
  };
  /** Their castle, once raised: its level and rating, fortresses and routs, and their war record. */
  castle: {
    level: number;
    rating: number;
    fortresses: number;
    routs: number;
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
}

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
} satisfies Record<string, RouteContract>;
