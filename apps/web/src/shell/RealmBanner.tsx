// The realm's banner (session 235): a line from the keepers of the realm across the top of every page, put up
// from the console until a time the admin set (an evening's maintenance, a season's start). Each player can
// put it away with its cross; it goes by itself once its time runs out.
import { t } from '@idle-clash/content';
import { CloseButton } from '@idle-clash/ui';
import { useEffect, useState } from 'react';
import { bannerShown, putAway, useBannerChanges } from '../game/banner.ts';
import { serverNow } from '../game/clock.ts';
import s from './banner.module.css';

/** The longest a timer is set for (browsers keep a timer's delay in 31 bits). */
const LONGEST = 2 ** 31 - 1;

export function RealmBanner() {
  useBannerChanges();
  const [, tick] = useState(0);
  const banner = bannerShown(serverNow());
  // Goes by itself once its time runs out.
  useEffect(() => {
    if (!banner) return;
    const id = setTimeout(() => tick((n) => n + 1), Math.min(LONGEST, banner.until - serverNow() + 500));
    return () => clearTimeout(id);
  }, [banner]);
  if (!banner) return null;
  return (
    <section className={s.banner} aria-label={t('banner.from')}>
      <p className={s.words}>
        <span className={s.from}>{t('banner.from')}</span>
        <span>{banner.text}</span>
      </p>
      <CloseButton label={t('banner.putAway')} className={s.close} onClick={putAway} />
    </section>
  );
}
