// The Deep's relics at the head of the Relics panel (session 215), from Hitpoints 99: three rows, each its
// icon, what it gives at its rank, the rank and the next rank's marks, with Raise. They work in the Deep
// alone and never run out of ranks.
import { t } from '@idle-clash/content';
import type { DeepRelicRow } from '@idle-clash/features';
import { ActionRow, Button, hasIcon, ItemIcon } from '@idle-clash/ui';
import { game } from '../game/store.ts';
import s from './expeditions.module.css';

export function DeepRelics({ rows }: { rows: DeepRelicRow[] }) {
  return (
    <div className={s.deepRelics} role="group" aria-label={t('deepRelic.title')}>
      <div className={s.deepRelicsHead}>
        <p className={s.lastTitle}>{t('deepRelic.title')}</p>
        <p className={s.note}>{t('deepRelic.note')}</p>
      </div>
      {rows.map((r) => (
        <ActionRow
          key={r.id}
          icon={hasIcon(r.id) ? <ItemIcon name={r.id} size={32} /> : undefined}
          name={r.name}
          facts={[r.gives, r.rank, r.next]}
          actions={
            <Button disabled={!r.ready} onClick={() => game.act('expeditions', 'deepRelic', { relic: r.id })}>
              {t('relic.raise')}
            </Button>
          }
        />
      ))}
    </div>
  );
}
