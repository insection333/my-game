// The Deeds tab's two sheets: one deed (`?panel=deed&deed=level-woodcutting-40`) with its words, tier,
// points, progress and what it unlocks; and the choice of honours (`?panel=honours`): every title,
// banner and frame, those open to show and how the rest are opened.
import { t } from '@idle-clash/content';
import type { DeedsView, HonourChoice, HonoursView } from '@idle-clash/features';
import { ActionRow, Button, Pill, ProgressBar, Sheet } from '@idle-clash/ui';
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

function Choice({ choice }: { choice: HonourChoice }) {
  return (
    <section className={s.choice} aria-label={choice.name}>
      <h3 className={s.choiceTitle}>{choice.name}</h3>
      {choice.options.map((o) => (
        <ActionRow
          key={o.id ?? 'none'}
          locked={!o.open}
          icon={
            choice.kind !== 'title' && o.id ? (
              <span
                className={s.swatch}
                data-kind={choice.kind}
                style={choice.kind === 'banner' ? bannerStyle(o.id) : frameStyle(o.id)}
              />
            ) : undefined
          }
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
