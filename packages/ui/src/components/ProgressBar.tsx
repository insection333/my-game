// Progress towards something: a level, a mastery step, an action. Always named for screen readers.
import s from './ProgressBar.module.css';

export function ProgressBar({ value, label, tone = 'moss' }: { value: number; label: string; tone?: 'moss' | 'woad' }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      data-ui="ProgressBar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={s.track}
    >
      <div className={`${s.fill} ${s[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
