// The Deep on the Expeditions tab (session 213), from Hitpoints 99: the deepest reached, the week's omens,
// where the next descent starts with the pack it carries and how deep that pack should go, the next boss
// and its way; or the descent under way, with Carry on and Surface.
import { t } from '@idle-clash/content';
import type { DeepView } from '@idle-clash/features';
import { ActionRow, Button, hasIcon, ItemIcon, Panel, Pill, ProgressBar } from '@idle-clash/ui';
import { useState } from 'react';
import { game } from '../game/store.ts';
import { Slot } from '../slots.tsx';
import { Twists } from './ExpeditionRoute.tsx';
import s from './expeditions.module.css';

const DEEP = { feature: 'expeditions', id: 'deep' } as const;
const start = () => game.command({ type: 'start', lane: 'combat', action: DEEP });

export function DeepPanel({ deep }: { deep: DeepView }) {
  const [sure, setSure] = useState(false);
  const run = deep.run;
  const descend = () => {
    const done = game.act('expeditions', 'descend', {});
    if (done && typeof done === 'object' && 'ok' in done && done.ok) start();
  };
  return (
    <Panel title={t('deep.title')} aside={deep.deepest ? <Pill tone="gold">{deep.deepest}</Pill> : undefined}>
      <Slot id="combat.deep" className={s.stack}>
        {!deep.deepest && <p className={s.note}>{t('deep.note')}</p>}
        {run && (
          <div className={s.stack}>
            <p className={s.summary}>{run.depth}</p>
            <ProgressBar value={run.progress} label={deep.boss.depth} tone="woad" />
            <p className={s.where}>
              <span>{run.meals}</span>
              {run.marks && <span>{run.marks}</span>}
            </p>
          </div>
        )}
        {!run && (
          <div>
            <p className={s.lastTitle}>{deep.from}</p>
            {deep.week && <p className={s.note}>{deep.week}</p>}
          </div>
        )}
        <div>
          {/* Under way, the meals left say the pack. */}
          {!run && <p className={s.note}>{deep.pack}</p>}
          {deep.reach && <p className={s.note}>{deep.reach}</p>}
        </div>
        <ActionRow
          icon={hasIcon(deep.boss.id) ? <ItemIcon name={deep.boss.id} size={32} /> : undefined}
          name={deep.boss.name}
          facts={[deep.boss.depth, ...(deep.boss.trait ? [deep.boss.trait] : [])]}
        />
        <div>
          <p className={s.note}>{deep.omensUntil}</p>
          <Twists twists={deep.omens} />
        </div>
        <div className={s.buttons}>
          {!run && (
            <Button variant="primary" onClick={descend}>
              {t('deep.descend')}
            </Button>
          )}
          {run && !run.running && (
            <Button variant="primary" onClick={start}>
              {t('deep.carryOn')}
            </Button>
          )}
          {run &&
            (sure ? (
              <>
                <span className={s.note}>{t('deep.surfaceNote')}</span>
                <Button onClick={() => (game.act('expeditions', 'surface', {}), setSure(false))}>
                  {t('deep.surface')}
                </Button>
                <Button variant="quiet" onClick={() => setSure(false)}>
                  {t('expedition.keepGoing')}
                </Button>
              </>
            ) : (
              <Button variant="quiet" onClick={() => setSure(true)}>
                {t('deep.surface')}
              </Button>
            ))}
        </div>
      </Slot>
    </Panel>
  );
}
