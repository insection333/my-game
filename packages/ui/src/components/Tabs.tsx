// Tabs between views of one page (Items and Collection log). Links, so each view has its own address.
import type { MouseEvent, ReactNode } from 'react';
import s from './Tabs.module.css';

export interface Tab {
  href: string;
  label: string;
  current: boolean;
  /** A small icon before the label (a skill's seal on the hiscores' ladders). */
  icon?: ReactNode;
}

export function Tabs({ tabs, label, onNavigate }: { tabs: Tab[]; label: string; onNavigate: (href: string) => void }) {
  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(href);
  };
  return (
    <nav aria-label={label} className={s.tabs}>
      {tabs.map((t) => (
        <a
          key={t.href}
          href={t.href}
          data-ui="Tab"
          aria-current={t.current ? 'page' : undefined}
          className={s.tab}
          onClick={(e) => go(e, t.href)}
        >
          {t.icon}
          {t.label}
        </a>
      ))}
    </nav>
  );
}
