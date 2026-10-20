import type { ReactNode } from 'react';
import s from './pages.module.css';

/** A page's title and the one sentence that says what the page is for. */
export function PageHead({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className={s.head}>
      <h1>{title}</h1>
      {lead && <p className={s.lead}>{lead}</p>}
      {children}
    </div>
  );
}
