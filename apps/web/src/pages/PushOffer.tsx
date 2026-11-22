// The offer of notices while away (session 171): made once in a browser, on a return whose recap holds what
// a notice would have told (a lane that stopped, a siege), never on a first visit; one quiet button in the
// recap's Collect row, so the recap is no taller (on a phone the goals stay on the first screen), and the
// browser itself asks only once the player presses it. Shown is offered: it does not come back.
import { t } from '@idle-clash/content';
import { Button } from '@idle-clash/ui';
import { useEffect, useState } from 'react';
import { notePushOffered, pushOffered, pushOn, pushState } from '../push.ts';

export function PushOffer({ worth }: { worth: boolean }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!worth || pushOffered()) return;
    let live = true;
    void pushState().then((st) => {
      if (!live || st !== 'off') return;
      setShown(true);
      notePushOffered();
    });
    return () => {
      live = false;
    };
  }, [worth]);
  if (!shown) return null;
  return (
    <span data-slot="push.offer">
      <Button
        variant="quiet"
        onClick={() => {
          setShown(false);
          void pushOn().catch(() => undefined);
        }}
      >
        {t('push.offer.yes')}
      </Button>
    </span>
  );
}
