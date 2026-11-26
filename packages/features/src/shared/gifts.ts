// Gifts (session 254, the plan of 26 November, phase 5): a friend sends a supply cache once a day. The server
// keeps the gifts and tells the save which wait (`features.gifts`, as the realm's week is told), and the
// goals feature opens one into a cache drawn as the player's own goals' are, worth a quarter of an hour of
// their own earning: nothing leaves the giver's Storehouse and nothing passes between accounts.
import type { State } from '@idle-clash/kernel';
import { z } from 'zod';

/** The gifts waiting, as the server tells the save: the most it holds for a player. */
export const GIFTS_WAITING = 10;

export const GiftsMirror = z
  .object({
    waiting: z
      .array(
        z
          .object({ id: z.number().int().positive(), from: z.string().max(32), at: z.number().int().nonnegative() })
          .strict(),
      )
      .max(GIFTS_WAITING),
  })
  .strict();
export type GiftsMirror = z.infer<typeof GiftsMirror>;

/** The gifts the server says wait, as it last told the save; none where it has not. */
export function giftsMirror(state: State): GiftsMirror['waiting'] {
  const r = GiftsMirror.safeParse(state.features.gifts);
  return r.success ? r.data.waiting : [];
}
