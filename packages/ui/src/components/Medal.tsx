// A deed's medallion: its mark (a level, a count) or an icon, ringed in its tier's colour; filled when
// done, with a thin bar of how far along while not. A button: it opens the deed's sheet.
import type { CSSProperties, ReactNode } from 'react';
import s from './Medal.module.css';

export type MedalTier = 'easy' | 'hard' | 'elite' | 'master';

export interface MedalProps {
  tier: MedalTier;
  done: boolean;
  /** 0 to 1, shown while not done. */
  progress: number;
  /** What a screen reader hears, and the tooltip: the deed's name, text and state. */
  label: string;
  mark: ReactNode;
  onClick: () => void;
}

export function Medal({ tier, done, progress, label, mark, onClick }: MedalProps) {
  return (
    <button
      type="button"
      data-ui="Medal"
      data-state={done ? `${tier}-done` : tier}
      className={s.medal}
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ '--p': Math.min(1, Math.max(0, progress)) } as CSSProperties}
    >
      <span className={s.mark}>{mark}</span>
      {!done && progress > 0 && <span className={s.bar} aria-hidden="true" />}
    </button>
  );
}
