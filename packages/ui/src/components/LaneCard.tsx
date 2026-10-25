// A lane: what it is doing, how far along, and why it stopped. Full on the Hearth and the desktop
// lanes panel; compact (a chip that opens the lane) in the phone's lanes strip.
import type { ReactNode } from 'react';
import { ProgressBar, ProgressFill, type ProgressRun } from './ProgressBar.tsx';
import s from './LaneCard.module.css';

export interface LaneCardProps {
  lane: string;
  /** The action's name, or what an idle lane is waiting for. */
  doing: string;
  idle: boolean;
  /** 0 to 1 through the current action; omitted when idle. */
  progress?: number;
  /** The current run, so the bar fills smoothly to its end. */
  run?: ProgressRun;
  /** A stop reason or the queued Next action, as the player reads it. */
  note?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  /** Stopped by itself and waiting for the player: the chip says why and stands out. */
  halted?: boolean;
  /** What a compact chip is heard as, where it shows something shorter ("Gathering: Resting"). */
  label?: string;
  onOpen?: () => void;
}

export function LaneCard({
  lane,
  doing,
  idle,
  progress,
  run,
  note,
  icon,
  actions,
  compact,
  halted,
  onOpen,
  label,
}: LaneCardProps) {
  if (compact) {
    return (
      <button
        type="button"
        data-ui="LaneChip"
        className={s.chip}
        data-idle={idle || undefined}
        data-halted={halted || undefined}
        aria-label={label}
        onClick={onOpen}
      >
        {icon && (
          <span key={run?.key} className={s.icon}>
            {icon}
          </span>
        )}
        <span className={s.chipText}>
          <span className="visually-hidden">{lane}: </span>
          {doing}
        </span>
        {progress !== undefined && <ProgressFill value={progress} run={run} className={s.chipBar} />}
      </button>
    );
  }
  return (
    <div data-ui="LaneCard" role="listitem" className={s.card} data-idle={idle || undefined}>
      <div className={s.head}>
        <span className={s.lane}>{lane}</span>
      </div>
      <div className={s.doing}>
        {/* Each new run plays the icon's small hit, so the work is seen landing. */}
        {icon && (
          <span key={run?.key} className={s.icon}>
            {icon}
          </span>
        )}
        {doing}
      </div>
      {progress !== undefined && <ProgressBar value={progress} run={run} label={`${lane}: ${doing}`} />}
      {note && <div className={s.note}>{note}</div>}
      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  );
}
