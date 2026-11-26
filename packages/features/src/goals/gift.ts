// Gifts opened (session 254): a friend's gift waits on the Hearth until opened, a supply cache drawn as the
// player's own goals' caches are, worth a quarter of an hour of their own earning, so a gift is the same
// small pleasure to a newcomer and a veteran and nothing passes from the giver.
import { fmt, t } from '@idle-clash/content';
import type { GameEvent, State } from '@idle-clash/kernel';
import { giftsMirror } from '../shared/gifts.ts';
import { ERRAND_ORDER, type ErrandRow } from '../shared/errand.ts';
import { earning, nice, paces } from '../shared/pace.ts';
import { cacheFor, openCache } from './cache.ts';
import { goalsOf, setGoals } from './state.ts';

/** A gift's worth, in seconds of the player's own earning. */
export const GIFT_SECONDS = 900;
export const GIFTS_HREF = '/?panel=gifts';

export const giftWorth = (state: State): number => Math.max(50, nice(earning(paces(state)) * GIFT_SECONDS));

/** The gifts waiting to be opened: those the server says wait, less those opened since it last said. */
export function giftsWaiting(state: State): { id: number; from: string; at: number }[] {
  const opened = goalsOf(state).gifts;
  return giftsMirror(state).filter((g) => !opened.includes(g.id));
}

export type GiftResult = { ok: true } | { ok: false; reason: 'none' };

/** Opens a waiting gift into a supply cache. */
export function openGift(
  state: State,
  id: number,
  now: number,
): { state: State; result: GiftResult; events: GameEvent[] } {
  const gift = giftsWaiting(state).find((g) => g.id === id);
  if (!gift) return { state, result: { ok: false, reason: 'none' }, events: [] };
  const g = goalsOf(state);
  const out = structuredClone(state);
  const cache = cacheFor(state, giftWorth(state), g.opened);
  openCache(out, cache);
  setGoals(out, { ...g, opened: g.opened + 1, gifts: [...g.gifts, id].slice(-30) });
  return {
    state: out,
    result: { ok: true },
    events: [{ type: 'giftOpened', at: now, gift: id, from: gift.from, cache }],
  };
}

export interface GiftsView {
  rows: { id: number; from: string; when: string }[];
  /** What a gift holds, said before it is opened. */
  note: string;
}

export function giftsView(state: State, now: number): GiftsView {
  return {
    rows: giftsWaiting(state).map((g) => ({
      id: g.id,
      from: g.from || t('gift.someone'),
      when: fmt.when(g.at, now),
    })),
    note: t('gift.note', { gold: fmt.int(giftWorth(state)) }),
  };
}

/** A gift waiting, on the Hearth's Next up with the rewards. */
export function giftErrands(state: State): ErrandRow[] {
  const waiting = giftsWaiting(state);
  if (!waiting.length) return [];
  const from = waiting[0].from || t('gift.someone');
  return [
    {
      icon: 'supply-cache',
      text:
        waiting.length === 1 ? t('errand.gift', { name: from }) : t('errand.gifts', { count: fmt.int(waiting.length) }),
      href: GIFTS_HREF,
      order: ERRAND_ORDER.share,
    },
  ];
}
