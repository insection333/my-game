// The realm's banner (session 235): a line from the keepers of the realm, written in the console, shown to
// every player across the top of the game until a time the admin sets (an evening's maintenance, a season's
// start), each player able to put it away. One at a time: a new one takes the old one's place.
import { z } from 'zod';
import { PATHS } from './paths.ts';
import type { RouteContract } from './routes.ts';

/** The longest banner: a line or two on a phone. */
export const BANNER_MAX = 200;
/** How long a banner may stand, in hours: up to a week. */
export const BANNER_HOURS = [1, 6, 24, 72, 168] as const;

export const BannerRequest = z
  .object({
    text: z.string().trim().min(10).max(BANNER_MAX),
    hours: z.union([z.literal(1), z.literal(6), z.literal(24), z.literal(72), z.literal(168)]),
  })
  .strict();

/** The banner as every player's page holds it. */
export interface Banner {
  /** When it was put up: a banner put away by a player stays away, and a new one shows. */
  id: number;
  text: string;
  until: number;
}
/** As the console shows it: who put it up too. */
export interface BannerView extends Banner {
  actor: string;
}

const route = (r: RouteContract) => r;
export const CONSOLE_BANNER_ROUTES = {
  adminBanner: route({
    id: 'adminBanner',
    method: 'POST',
    path: PATHS.adminBanner,
    auth: 'admin',
    input: BannerRequest,
    example: { text: 'The realm rests from 22:00 to 22:30 UTC tonight while the keepers mend the roads.', hours: 12 },
  }),
  adminBannerDown: route({
    id: 'adminBannerDown',
    method: 'POST',
    path: PATHS.adminBannerDown,
    auth: 'admin',
    input: null,
    example: null,
  }),
} satisfies Record<string, RouteContract>;
