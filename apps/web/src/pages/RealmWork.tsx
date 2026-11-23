// The realm's work of the season (session 218): a tile across the head of the steading's works, and its sheet
// (`?panel=realm-work`): where it stands, what the realm has given and your part, the thanks for the last work
// raised with your part, and what you can give (gold in a few amounts, or all of a material held).
import { t } from '@idle-clash/content';
import type { RealmWorkView } from '@idle-clash/features';
import { ActionRow, Button, hasIcon, ItemIcon, Pill, ProgressBar, Sheet } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { navigate } from '../router.ts';
import { fills } from '../slots.tsx';
import s from './steading.module.css';

const SHEET = '/?panel=realm-work';

export function RealmWorkTile({ view }: { view: RealmWorkView }) {
  return (
    <a
      href={SHEET}
      data-ui="RowLink"
      data-variant={view.finished ? 'ready' : undefined}
      className={`${s.work} ${s.realmWork}`}
      onClick={(e) => (e.preventDefault(), navigate(SHEET))}
    >
      <span className={s.head}>
        <span className={s.short}>{t('realmWork.title')}</span>
        <span className={s.name}>{view.name}</span>
      </span>
      <ProgressBar value={view.stage / view.stages} segments={view.stages} label={view.standing} decorative />
      <span className={s.below}>{view.mine ? `${view.standing}. ${view.mine}` : view.standing}</span>
    </a>
  );
}

export function RealmWorkSheet({ onClose }: { onClose: () => void }) {
  const { state, now, features } = useGame();
  const [view] = fills<RealmWorkView>(features, 'hearth.realmWork', state, now);
  const v = view?.data;
  return (
    <Sheet
      title={v?.name ?? t('realmWork.title')}
      closeLabel={t('shell.close')}
      onClose={onClose}
      slot="hearth.realmWork"
    >
      {v && (
        <div className={s.sheet}>
          <Pill tone={v.finished ? 'moss' : 'woad'}>{v.standing}</Pill>
          <ProgressBar value={v.stage / v.stages} segments={v.stages} label={v.standing} />
          <p className={s.now}>{v.given}</p>
          {v.mine && <p className={s.now}>{v.mine}</p>}
          <p className={s.held}>{v.ends}</p>
          {v.thanks && <p className={s.now}>{v.thanks}</p>}
          <p className={s.held}>{t('realmWork.note')}</p>
          {v.gold.length > 0 && (
            <div className={s.gifts}>
              {v.gold.map((g) => (
                <Button key={g.amount} onClick={() => game.act('steading', 'give', { gold: g.amount })}>
                  {g.label}
                </Button>
              ))}
            </div>
          )}
          {v.materials.length > 0 && (
            <div className={s.materials}>
              <p className={s.held}>{t('realmWork.materials')}</p>
              {v.materials.map((m) => (
                <ActionRow
                  key={m.item}
                  icon={hasIcon(m.item) ? <ItemIcon name={m.item} size={32} /> : undefined}
                  name={m.label}
                  facts={[m.worth]}
                  actions={
                    <Button onClick={() => game.act('steading', 'give', { item: m.item })}>
                      {t('realmWork.give')}
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
