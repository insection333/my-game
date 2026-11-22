// The offer of notices while away (session 171): made once in a browser, on a return whose recap holds what
// a notice would have told (a lane that stopped, a siege), never on a first visit; the browser itself asks
// only once the player says yes.
import { t } from '@idle-clash/content';
import { Button } from '@idle-clash/ui';
import { useEffect, useState } from 'react';
import { notePushOffered, pushOffered, pushOn, pushState } from '../push.ts';
import s from './pages.module.css';

export function PushOffer({ worth }: { worth: boolean }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!worth || pushOffered()) return;
    let live = true;
    void pushState().then((st) => live && setShown(st === 'off'));
    return () => {
      live = false;
    };
  }, [worth]);
  if (!shown) return null;
  const answer = (yes: boolean) => {
    notePushOffered();
    setShown(false);
    if (yes) void pushOn().catch(() => undefined);
  };
  return (
    <div className={s.offer} data-slot="push.offer">
      <span>{t('push.offer')}</span>
      <span className={s.offerActions}>
        <Button variant="quiet" onClick={() => answer(false)}>
          {t('push.offer.no')}
        </Button>
        <Button variant="secondary" onClick={() => answer(true)}>
          {t('push.offer.yes')}
        </Button>
      </span>
    </div>
  );
}
