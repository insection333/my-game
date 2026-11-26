// The pedlar's sheet (session 217, `?panel=pedlar`), opened from the Hearth's Next up: each of the day's lots
// with its picture, what is held, what it pays and Hand in (and what a running lane uses it for, session 225:
// ten of the dish a fight was eating went with no word); the favour earned, and when the wants change.
import { t } from '@idle-clash/content';
import { laneUsing, type PedlarView } from '@idle-clash/features';
import { ActionRow, Button, hasIcon, ItemIcon, Pill, Sheet } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { fills } from '../slots.tsx';
import s from './steading.module.css';

export function PedlarSheet({ onClose }: { onClose: () => void }) {
  const { state, now, features } = useGame();
  const [view] = fills<PedlarView>(features, 'hearth.pedlar', state, now);
  const v = view?.data;
  return (
    <Sheet title={t('pedlar.title')} closeLabel={t('shell.close')} onClose={onClose} slot="hearth.pedlar">
      {v && (
        <div className={s.sheet}>
          <p className={s.now}>{t('pedlar.note')}</p>
          <p className={s.held}>
            {v.favour}. {v.turns}.
          </p>
          {v.all && (
            <p>
              <Button onClick={() => game.act('pedlar', 'handInAll', {})}>{v.all}</Button>
            </p>
          )}
          {!v.lots.length && <p>{t('pedlar.none')}</p>}
          <div className={s.materials}>
            {v.lots.map((l) => (
              <ActionRow
                key={l.kind}
                icon={hasIcon(l.item) ? <ItemIcon name={l.item} size={32} /> : undefined}
                name={l.name}
                facts={[l.held, l.pays, ...(l.done ? [] : [laneUsing(state, l.item) ?? []].flat())]}
                status={l.done ? <Pill tone="moss">{t('pedlar.handed')}</Pill> : undefined}
                actions={
                  !l.done && (
                    <Button disabled={!l.ready} onClick={() => game.act('pedlar', 'handIn', { kind: l.kind })}>
                      {t('pedlar.handIn')}
                    </Button>
                  )
                }
              />
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}
