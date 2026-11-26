// Cheers and a gift on a friend's card (session 254): Cheer for what they did this week, three a day; and
// once a day Send a gift, a supply cache they open as one of their own. Each says why it cannot be sent.
import type { Profile, SocialState } from '@idle-clash/contracts';
import { t } from '@idle-clash/content';
import { cheerWhat } from '@idle-clash/features';
import { Button } from '@idle-clash/ui';
import { useState } from 'react';
import { api } from '../api.ts';
import { handled } from '../game/session.ts';
import { refused } from '../refused.ts';
import s from './profile.module.css';

const CHEER_WHY: Partial<Record<SocialState, string>> = { sent: 'cheer.sent', spent: 'cheer.spent' };
const GIFT_WHY: Partial<Record<SocialState, string>> = {
  given: 'gift.given',
  young: 'gift.young',
  sameWeek: 'gift.sameWeek',
  full: 'gift.full',
};
/** A refusal's words, by the server's code. */
const OWN = {
  nothingToCheer: t('cheer.none'),
  cheerSent: t('cheer.sent'),
  cheersSpent: t('cheer.spent'),
  giftGiven: t('gift.given'),
  giftYoung: t('gift.young'),
  giftSameWeek: t('gift.sameWeek'),
  giftFull: t('gift.full'),
};

export function Friendly({ name, social }: { name: string; social: NonNullable<Profile['social']> }) {
  const [cheer, setCheer] = useState<string | null>(null);
  const [gift, setGift] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const press = async (ask: 'cheer' | 'gift') => {
    setBusy(true);
    try {
      await api[ask](name);
      (ask === 'cheer' ? setCheer : setGift)(t(ask === 'cheer' ? 'cheer.sentNow' : 'gift.sentNow'));
    } catch (err) {
      if (!handled(err)) (ask === 'cheer' ? setCheer : setGift)(refused(err, OWN));
    } finally {
      setBusy(false);
    }
  };
  const c = social.cheer;
  const cheerWhy = CHEER_WHY[social.cheerState];
  const giftWhy = GIFT_WHY[social.gift];
  return (
    <div className={s.friendly} data-slot="player.social">
      {c && (
        <div className={s.friend}>
          <span>{t('cheer.offer', { what: cheerWhat(c.occasion, c.detail, c.place) })}</span>
          {cheer || cheerWhy ? (
            <span role="status" className={s.friendSaid}>
              {cheer ?? t(cheerWhy!)}
            </span>
          ) : (
            <Button variant="secondary" disabled={busy} onClick={() => void press('cheer')}>
              {t('cheer.button')}
            </Button>
          )}
        </div>
      )}
      <div className={s.friend}>
        <span>{t('gift.offer')}</span>
        {gift || giftWhy ? (
          <span role="status" className={s.friendSaid}>
            {gift ?? t(giftWhy!)}
          </span>
        ) : (
          <Button variant="secondary" disabled={busy} onClick={() => void press('gift')}>
            {t('gift.button')}
          </Button>
        )}
      </div>
    </div>
  );
}
