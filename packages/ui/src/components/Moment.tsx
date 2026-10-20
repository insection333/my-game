// A notable moment: a level, a find, a goal. Big ones take the centre; smaller ones a banner.
import type { ReactNode } from 'react';
import s from './Moment.module.css';

export interface MomentProps {
  size: 'centre' | 'banner';
  title: string;
  body?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function Moment({ size, title, body, icon, action }: MomentProps) {
  return (
    <div role="status" data-ui="Moment" data-size={size} className={`${s.moment} ${s[size]}`}>
      {icon && <div className={s.icon}>{icon}</div>}
      <div>
        <div className={s.title}>{title}</div>
        {body && <div className={s.body}>{body}</div>}
      </div>
      {action}
    </div>
  );
}
