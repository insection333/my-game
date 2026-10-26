// Tabs between views of one page (Items and Collection log). Links, so each view has its own address.
// A strip never scrolls sideways: when its labels do not fit (eight tiers on a phone) it turns compact,
// each tab showing its icon or short label and sharing the width equally, the full label kept as the
// tab's name for screen readers and as its tooltip.
import { useLayoutEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import s from './Tabs.module.css';

export interface Tab {
  href: string;
  label: string;
  current: boolean;
  /** A small icon before the label (a skill's seal on the hiscores' ladders, a tier's resource). */
  icon?: ReactNode;
  /** A shorter label, shown in place of the full one when the strip is too narrow ("Fen"); with an
   * icon, a small mark on its corner (a tier's number). */
  short?: string;
}

/** Turns the strip compact when its full labels would not fit, measured each time it is drawn. */
function useFit(ref: React.RefObject<HTMLElement | null>, key: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      el.removeAttribute('data-compact');
      if (el.scrollWidth > el.clientWidth + 1) el.setAttribute('data-compact', '');
    };
    check();
    const watch = new ResizeObserver(check);
    watch.observe(el);
    void document.fonts?.ready.then(check);
    return () => watch.disconnect();
  }, [ref, key]);
}

export function Tabs({ tabs, label, onNavigate }: { tabs: Tab[]; label: string; onNavigate: (href: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  useFit(ref, tabs.map((t) => t.label).join('|'));
  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(href);
  };
  return (
    <nav aria-label={label} className={s.tabs} ref={ref}>
      {tabs.map((t) => (
        <a
          key={t.href}
          href={t.href}
          data-ui="Tab"
          aria-current={t.current ? 'page' : undefined}
          className={s.tab}
          title={t.label}
          onClick={(e) => go(e, t.href)}
        >
          {t.icon && (
            <span className={s.icon} aria-hidden>
              {t.icon}
              {t.short && <span className={s.badge}>{t.short}</span>}
            </span>
          )}
          <span className={t.icon || t.short ? s.full : undefined}>{t.label}</span>
          {t.short && !t.icon && (
            <span className={s.short} aria-hidden>
              {t.short}
            </span>
          )}
        </a>
      ))}
    </nav>
  );
}
