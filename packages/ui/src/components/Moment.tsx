// A notable moment: a level, a find, a goal. Big ones take the centre; smaller ones a banner, the
// smallest a toast.
import type { ReactNode } from 'react';
import s from './Moment.module.css';

export interface MomentProps {
  size: 'centre' | 'banner' | 'toast';
  title: string;
  body?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function Moment({ size, title, body, icon, action }: MomentProps) {
  return (
    <div role="status" data-ui="Moment" data-size={size} className={`${s.moment} ${s[size]}`}>
      {icon && (
        <div className={s.icon}>
          {/* A big moment's icon stands in a burst of light that opens once and stays still. */}
          {size === 'centre' && <span className={s.burst} aria-hidden="true" />}
          {icon}
        </div>
      )}
      <div>
        <div className={s.title}>{title}</div>
        {body && <div className={s.body}>{body}</div>}
      </div>
      {action}
    </div>
  );
}
