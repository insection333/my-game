// A panel groups related content under one heading. Rows inside are divided by hairlines, not boxed.
import type { ReactNode } from 'react';
import s from './Panel.module.css';

export interface PanelProps {
  title?: ReactNode;
  /** Shown at the end of the heading row: a count, a pill, a quiet button. */
  aside?: ReactNode;
  children: ReactNode;
  /** Rows sit flush with the panel's edges (lists); otherwise content is padded. */
  flush?: boolean;
  className?: string;
}

export function Panel({ title, aside, children, flush, className }: PanelProps) {
  return (
    <div data-ui="Panel" className={[s.panel, className].filter(Boolean).join(' ')}>
      {(title || aside) && (
        <div className={s.head}>
          {title && <h2 className={s.title}>{title}</h2>}
          {aside && <div className={s.aside}>{aside}</div>}
        </div>
      )}
      <div className={flush ? s.flush : s.body}>{children}</div>
    </div>
  );
}
