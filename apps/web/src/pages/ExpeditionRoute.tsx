// An expedition's route as the Expeditions tab draws it: its twists, each with what it changes, and the
// route as a ribbon, an hour a row (each stage's foe, any cache or camp, the fork, the boss).
import { fmt, t } from '@idle-clash/content';
import type { StageChip, TwistView } from '@idle-clash/features';
import { hasIcon, ItemIcon, Pill } from '@idle-clash/ui';
import s from './expeditions.module.css';

export function Twists({ twists }: { twists: TwistView[] }) {
  return (
    <ul className={s.twists} aria-label={t('expedition.twists')}>
      {twists.map((x) => (
        <li key={x.id}>
          <Pill tone="woad">{x.name}</Pill>
          <span>{x.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** The route as a ribbon, an hour a row: each stage's foe, then any cache or camp, the fork where the
 *  road divides, and the boss at the end. */
export function Ribbon({ stages, boss }: { stages: StageChip[]; boss: string }) {
  const hours = Math.max(1, Math.ceil(stages.length / 6));
  const forkAt = stages.findIndex((x) => x.afterFork);
  return (
    // A long route scrolls inside its own box, which takes the keyboard too.
    <div className={s.ribbonBox} tabIndex={0} role="group" aria-label={t('expedition.route')}>
      <ol className={s.ribbon}>
        {Array.from({ length: hours }, (_, h) => (
          <li key={h} className={s.hour} aria-label={t('expedition.hour', { hour: fmt.int(h + 1) })}>
            <span className={s.hourLabel} aria-hidden="true">
              {fmt.int(h + 1)}
            </span>
            <span className={s.chips}>
              {stages.slice(h * 6, h * 6 + 6).map((x, i) => (
                <Stage key={i} stage={x} fork={h * 6 + i === forkAt} />
              ))}
              {h === hours - 1 && <Chip icon={boss} label={t(`boss.${boss}`)} boss />}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Stage({ stage, fork }: { stage: StageChip; fork: boolean }) {
  return (
    <>
      {fork && <Chip icon="fork" label={t('expedition.forkHere')} />}
      <Chip icon={stage.foe} label={stage.name} state={stage.state} />
      {stage.after && (
        <Chip
          icon={stage.after === 'cache' ? 'supply-cache' : 'camp'}
          label={stage.after === 'cache' ? t('expedition.cache') : t('expedition.camp')}
          state={stage.state}
          small
        />
      )}
    </>
  );
}

function Chip({
  icon,
  label,
  state,
  boss,
  small,
}: {
  icon: string;
  label: string;
  state?: StageChip['state'];
  boss?: boolean;
  small?: boolean;
}) {
  return (
    <span
      className={s.chip}
      data-state={state}
      data-boss={boss || undefined}
      data-small={small || undefined}
      role="img"
      aria-label={label}
      title={label}
    >
      {hasIcon(icon) && <ItemIcon name={icon} size={24} />}
    </span>
  );
}

/** Every twist and road a run may meet, folded away until asked for. */
export function Legend({ twists }: { twists: TwistView[] }) {
  return (
    <details className={s.legend}>
      <summary>{t('expedition.legend')}</summary>
      <dl>
        {twists.map((x) => (
          <div key={x.id}>
            <dt>{x.name}</dt>
            <dd>{x.text}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
