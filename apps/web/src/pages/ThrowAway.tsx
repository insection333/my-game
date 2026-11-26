// Throwing away an item worth nothing (session 276): the first two tiers' runes, whetstones and arrows have no
// price, so they could not be sold, and a fighter carries the best supply held, so an earlier tier's is never
// used again: they held a space for good. Asked first, as selling all but one is; what the pedlar wants today
// stays, and nothing goes while a running lane uses it or it is locked (the panel says each).
import { fmt, t } from '@idle-clash/content';
import { laneUsing, pedlarWants, storehouseData, throwable, worthless } from '@idle-clash/features';
import { countOf } from '@idle-clash/kernel';
import { useState } from 'react';
import { Button } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import s from './items.module.css';

export function ThrowAway({ item }: { item: string }) {
  const { state, now } = useGame();
  const [asking, setAsking] = useState(false);
  const [done, setDone] = useState('');
  if (!worthless(item)) return null;
  const have = countOf(state, item);
  const count = throwable(state, item, now);
  const using = laneUsing(state, item);
  const kept = have - count;
  const go = () => {
    setAsking(false);
    const r = game.act('storehouse', 'throwAway', { item }) as { ok: boolean; count?: number } | null;
    if (r?.ok) setDone(t('store.thrown', { count: fmt.int(r.count ?? count) }));
  };
  return (
    <div>
      {have > 0 && <p className={s.muted}>{t('store.worthless')}</p>}
      {using && have > 0 && <p className={s.inUse}>{using}</p>}
      {!using && kept > 0 && have > 0 && !storehouseData.isLocked(state, item) && pedlarWants(state, now, item) && (
        <p className={s.inUse}>{t('store.throwKept', { count: fmt.int(kept) })}</p>
      )}
      {count > 0 && asking && (
        <div className={s.ask}>
          <p>{t('store.throwAsk', { count: fmt.int(count) })}</p>
          <div className={s.actions}>
            <Button variant="primary" data-answer onClick={go}>
              {t('store.throwAway')}
            </Button>
            <Button variant="secondary" onClick={() => setAsking(false)}>
              {t('store.sellNo')}
            </Button>
          </div>
        </div>
      )}
      {count > 0 && !asking && (
        <div className={s.actions}>
          <Button variant="secondary" onClick={() => (setAsking(true), setDone(''))}>
            {t('store.throwAway')}
          </Button>
        </div>
      )}
      <p role="status" className={s.sold}>
        {done}
      </p>
    </div>
  );
}
