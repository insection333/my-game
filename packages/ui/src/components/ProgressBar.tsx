// Progress towards something: a level, a mastery step, an action. Always named for screen readers.
// An action under way (`run`) fills smoothly to its end on its own (one CSS animation for the whole
// action, so nothing redraws it each second); with reduced motion it steps with the page instead.
import { useState, type CSSProperties } from 'react';
import s from './ProgressBar.module.css';

export interface ProgressRun {
  /** Changes when a new run starts (its start time), so the fill begins again from empty. */
  key: string | number;
  /** Milliseconds until it is full. */
  msLeft: number;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

function RunningFill({ value, msLeft, className }: { value: number; msLeft: number; className: string }) {
  // Where it was and how long it had left when this run was first drawn; later draws leave it be.
  const [from] = useState(value);
  const [ms] = useState(Math.max(0, msLeft));
  return (
    <div
      className={`${className} ${s.running}`}
      style={{ '--from': from, '--now': value, animationDuration: `${ms}ms` } as CSSProperties}
    />
  );
}

/** The fill alone, for a bar drawn another way (a lane chip's edge). */
export function ProgressFill({ value, run, className }: { value: number; run?: ProgressRun; className: string }) {
  const v = clamp(value);
  return run ? (
    <RunningFill key={run.key} value={v} msLeft={run.msLeft} className={className} />
  ) : (
    <div className={`${className} ${s.still}`} style={{ transform: `scaleX(${v})` }} />
  );
}

export function ProgressBar({
  value,
  label,
  tone = 'moss',
  run,
  decorative,
  segments,
}: {
  value: number;
  label: string;
  tone?: 'moss' | 'woad';
  run?: ProgressRun;
  /** The words beside it already say how far (a skill's tile): it is drawn, not announced. */
  decorative?: boolean;
  /** Drawn in equal steps (mastery's ten), each step a segment. */
  segments?: number;
}) {
  const v = clamp(value);
  const a11y = decorative
    ? { 'aria-hidden': true as const }
    : {
        role: 'progressbar',
        'aria-label': label,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': Math.round(v * 100),
      };
  return (
    <div data-ui="ProgressBar" {...a11y} className={s.track}>
      <ProgressFill value={v} run={run} className={`${s.fill} ${s[tone]}`} />
      {segments && <div className={s.notches} style={{ '--n': segments } as CSSProperties} />}
    </div>
  );
}
