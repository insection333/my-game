// The quartermaster (session 191): once every relic is fully raised, marks are traded for gold, 25 for an
// hour of the player's earning, one lot or all held at once; the trade is said under the presses.
import { fmt, t } from '@idle-clash/content';
import { marksText, type TradeView } from '@idle-clash/features';
import { useState } from 'react';
import { Button } from '@idle-clash/ui';
import { game } from '../game/store.ts';
import s from './expeditions.module.css';

export function Quartermaster({ trade }: { trade: TradeView }) {
  const [said, setSaid] = useState('');
  const press = (lots: number) => {
    const r = game.act('expeditions', 'trade', { lots }) as { ok: boolean; gold?: number; marks?: number } | null;
    if (r?.ok) setSaid(t('trade.done', { marks: marksText(r.marks ?? 0), gold: fmt.int(r.gold ?? 0) }));
  };
  return (
    <div className={s.trade} data-trade>
      <p>{trade.text}</p>
      <div className={s.tradeActions}>
        <Button disabled={trade.lots < 1} onClick={() => press(1)}>
          {trade.one}
        </Button>
        {trade.all && (
          <Button variant="secondary" onClick={() => press(trade.lots)}>
            {trade.all}
          </Button>
        )}
      </div>
      <p role="status" className={s.traded}>
        {said}
      </p>
    </div>
  );
}
