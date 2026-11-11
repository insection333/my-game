// The Deeds tab's two sheets: one deed (`?panel=deed&deed=level-woodcutting-40`) with its words, tier,
// points, progress and what it unlocks; and the choice of honours (`?panel=honours`): the thirty pictures
// as a grid (session 43), then every title, badge, frame, glow, banner and scene, those open to show and
// how the rest are opened.
import { t } from '@idle-clash/content';
import type { DeedsView, HonourChoice, HonoursView } from '@idle-clash/features';
import { ActionRow, Button, ItemIcon, Picture, Pill, ProgressBar, Sheet } from '@idle-clash/ui';
import { useGame } from '../game/hooks.ts';
import { game } from '../game/store.ts';
import { fills } from '../slots.tsx';
import { DeedMedal } from './Deeds.tsx';
import { bannerStyle, frameStyle } from './honours-style.ts';
import s from './deeds.module.css';

export function DeedSheet({ onClose }: { onClose: () => void }) {
  const { state, now, features } = useGame();
  const [view] = fills<DeedsView>(features, 'hiscores.deeds', state, now);
  const id = new URLSearchParams(location.search).get('deed') ?? '';
  const step = view?.data.categories
    .flatMap((c) => c.families.flatMap((f) => f.rows.flatMap((r) => r.steps)))
    .find((x) => x.id === id);
  return (
    <Sheet title={step?.name ?? t('deeds.title')} closeLabel={t('shell.close')} onClose={onClose} slot="hiscores.deed">
      {step && (
        <div className={s.sheet}>
          <div className={s.sheetHead}>
            <DeedMedal step={step} />
            <span className={s.worth}>{step.worth}</span>
          </div>
          <p className={s.text}>{step.text}</p>
          {step.done ? (
            <Pill tone="moss">{step.done}</Pill>
          ) : (
            !step.secret && (
              <ProgressBar value={step.progress} label={step.count ? `${step.name}: ${step.count}` : step.name} />
            )
          )}
          {!step.done && step.count && <p className={s.count}>{step.count}</p>}
          {step.unlocks.length > 0 && (
            <p className={s.unlocks}>{t('deeds.unlocks', { honours: step.unlocks.join(', ') })}</p>
          )}
        </div>
      )}
    </Sheet>
  );
}

export function HonoursSheet({ onClose }: { onClose: () => void }) {
  const { state, now, features } = useGame();
  const [view] = fills<HonoursView>(features, 'hiscores.honours', state, now);
  return (
    <Sheet title={t('deeds.choose')} closeLabel={t('shell.close')} onClose={onClose} slot="hiscores.choose">
      {view && (
        <div className={s.choices}>
          {view.data.choices.map((choice) => (
            <Choice key={choice.kind} choice={choice} />
          ))}
        </div>
      )}
    </Sheet>
  );
}

/** What an option looks like beside its name: a banner's colour, a frame's metal, a glow round the
 *  forester, a badge, a scene's sky. */
function Preview({ kind, id }: { kind: HonourChoice['kind']; id: string }) {
  if (kind === 'glow') return <Picture picture="forester" glow={id} size={32} />;
  if (kind === 'badge') return <ItemIcon name={`badge-${id}`} size={32} />;
  if (kind === 'scene') return <span className={s.swatch} data-kind="scene" data-scene={id} />;
  return <span className={s.swatch} data-kind={kind} style={kind === 'banner' ? bannerStyle(id) : frameStyle(id)} />;
}

/** The thirty pictures as a grid: those open to choose, the rest shown in grey with how they open beneath,
 *  a foe's with how many of it are slain ("47 of 100": session 77). */
function Pictures({ choice }: { choice: HonourChoice }) {
  return (
    <section className={s.choice} aria-label={choice.name}>
      <h3 className={s.choiceTitle}>{choice.name}</h3>
      <ul className={s.pictures}>
        {choice.options.map((o) =>
          o.id === null ? null : (
            <li key={o.id}>
              <button
                type="button"
                data-ui="ItemTile"
                className={s.pictureTile}
                aria-pressed={o.current}
                disabled={!o.open}
                title={o.unlock ?? o.name}
                onClick={() => game.act('deeds', 'choose', { kind: 'picture', id: o.id })}
              >
                <ItemIcon name={`portrait-${o.id}`} size={48} silhouette={!o.open} />
                <span className={s.pictureName}>{o.name}</span>
                {o.progress && <span className={s.pictureCount}>{o.progress}</span>}
              </button>
            </li>
          ),
        )}
      </ul>
      <p className={s.pictureNote}>{t('honour.picture.note')}</p>
    </section>
  );
}

function Choice({ choice }: { choice: HonourChoice }) {
  if (choice.kind === 'picture') return <Pictures choice={choice} />;
  return (
    <section className={s.choice} aria-label={choice.name}>
      <h3 className={s.choiceTitle}>{choice.name}</h3>
      {choice.options.map((o) => (
        <ActionRow
          key={o.id ?? 'none'}
          locked={!o.open}
          icon={choice.kind !== 'title' && o.id ? <Preview kind={choice.kind} id={o.id} /> : undefined}
          name={o.name}
          facts={o.unlock ? [o.unlock] : []}
          status={o.current ? <Pill tone="woad">{t('deeds.showing')}</Pill> : undefined}
          actions={
            o.open &&
            !o.current && (
              <Button onClick={() => game.act('deeds', 'choose', { kind: choice.kind, id: o.id })}>
                {t('deeds.show')}
              </Button>
            )
          }
        />
      ))}
    </section>
  );
}
