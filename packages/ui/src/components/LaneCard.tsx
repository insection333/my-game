// A lane: what it is doing, how far along, and why it stopped. Full on the Hearth and the desktop
// lanes panel; compact (a chip that opens the lane) in the phone's lanes strip.
import type { ReactNode } from 'react';
import { ProgressBar } from './ProgressBar.tsx';
import s from './LaneCard.module.css';

export interface LaneCardProps {
  lane: string;
  /** The action's name, or what an idle lane is waiting for. */
  doing: string;
  idle: boolean;
  /** 0 to 1 through the current action; omitted when idle. */
  progress?: number;
  /** A stop reason or the queued Next action, as the player reads it. */
  note?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  /** Stopped by itself and waiting for the player: the chip says why and stands out. */
  halted?: boolean;
  onOpen?: () => void;
}

export function LaneCard({ lane, doing, idle, progress, note, icon, actions, compact, halted, onOpen }: LaneCardProps) {
  if (compact) {
    return (
      <button
        type="button"
        data-ui="LaneChip"
        className={s.chip}
        data-idle={idle || undefined}
        data-halted={halted || undefined}
        onClick={onOpen}
      >
        {icon}
        <span className={s.chipText}>
          <span className="visually-hidden">{lane}: </span>
          {doing}
        </span>
        {progress !== undefined && <span className={s.chipBar} style={{ width: `${Math.round(progress * 100)}%` }} />}
      </button>
    );
  }
  return (
    <div data-ui="LaneCard" className={s.card} data-idle={idle || undefined}>
      <div className={s.head}>
        <span className={s.lane}>{lane}</span>
        {icon}
      </div>
      <div className={s.doing}>{doing}</div>
      {progress !== undefined && <ProgressBar value={progress} label={`${lane}: ${doing}`} />}
      {note && <div className={s.note}>{note}</div>}
      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  );
}
