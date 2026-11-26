// Cheers and gifts in words (session 254), as a moment and the notices tray say them: who cheered and what
// for, a gift come and where it is opened.
import { fmt, midSentence, t } from '@idle-clash/content';
import type { GameEvent } from '@idle-clash/kernel';
import { legendName } from './castle/words.ts';
import { rankUpWords } from './rank-up.ts';
import { realmName } from './realm-words.ts';

type Cheered = Extract<GameEvent, { type: 'cheered' }>;

/** What a cheer is for, in words: "reaching 3rd on the Woodcutting hiscores". */
export function cheerWhat(occasion: Cheered['occasion'], detail: string, place: number): string {
  if (occasion === 'rank')
    return t('cheer.whatRank', {
      climb: rankUpWords({ type: 'rankUp', at: 0, skill: detail, place, band: 0 }).title,
    });
  if (occasion === 'legend') return t('cheer.whatLegend', { legend: legendName(detail) });
  return t('cheer.whatStrike', { boss: midSentence(realmName(detail)) });
}

export function cheeredWords(e: Cheered): { title: string; body: string; icon: string | null } {
  return {
    title: t('cheer.came', { name: e.from || t('gift.someone') }),
    body: t('cheer.for', { what: cheerWhat(e.occasion, e.detail, e.place) }),
    icon: e.occasion === 'strike' ? e.detail : e.occasion === 'legend' ? 'tech-siegecraft' : null,
  };
}

export function giftOpenedWords(e: Extract<GameEvent, { type: 'giftOpened' }>): string {
  return e.from ? t('gift.opened', { name: e.from }) : t('gift.openedSomeone');
}

export function giftCameWords(e: Extract<GameEvent, { type: 'giftCame' }>): { title: string; body: string } {
  return { title: t('gift.came', { name: e.from || t('gift.someone') }), body: t('gift.cameBody') };
}

/** What a cache held, as the moment says it: "A rich cache: 1,650 gold". */
export function cacheText(cache: { grade: string; items: { item: string; count: number }[] }): string {
  const items = cache.items.map((i) =>
    i.item === 'gold'
      ? t('goals.reward.gold', { amount: fmt.int(i.count) })
      : t('action.gives', { item: t(`item.${i.item}`), count: fmt.int(i.count) }),
  );
  return t('cache.holds', { cache: t(`cache.${cache.grade}`), items: items.join(', ') });
}

/** A cheer or a gift as its moment: who and what for, or what the cache held. */
export function socialMoment(e: Extract<GameEvent, { type: 'cheered' | 'giftCame' | 'giftOpened' }>): {
  title: string;
  body: string;
  icon: string | null;
} {
  if (e.type === 'cheered') return cheeredWords(e);
  if (e.type === 'giftCame') return { ...giftCameWords(e), icon: 'supply-cache' };
  return { title: giftOpenedWords(e), body: cacheText(e.cache), icon: 'supply-cache' };
}
