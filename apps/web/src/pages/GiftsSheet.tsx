// The gifts waiting (session 254, `?panel=gifts`), opened from the Hearth's Next up: each friend's gift with
// Open, which draws it as a supply cache of the player's own; and what a gift holds.
import { t } from '@idle-clash/content';
import type { GiftsView } from '@idle-clash/features';
import { ActionRow, Button, ItemIcon, Sheet } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { fills } from '../slots.tsx';
import s from './steading.module.css';

export function GiftsSheet({ onClose }: { onClose: () => void }) {
  const { state, now, features } = useGame();
  const [view] = fills<GiftsView>(features, 'hearth.gifts', state, now);
  const v = view?.data;
  return (
    <Sheet title={t('gift.title')} closeLabel={t('shell.close')} onClose={onClose} slot="hearth.gifts">
      {v && (
        <div className={s.sheet}>
          <p className={s.now}>{v.note}</p>
          <div className={s.materials}>
            {v.rows.map((g) => (
              <ActionRow
                key={g.id}
                icon={<ItemIcon name="supply-cache" size={32} />}
                name={t('gift.from', { name: g.from })}
                facts={[g.when]}
                actions={<Button onClick={() => game.act('goals', 'openGift', { id: g.id })}>{t('gift.open')}</Button>}
              />
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}
