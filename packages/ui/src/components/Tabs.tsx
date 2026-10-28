// Tabs between views of one page (Items and Collection log). Links, so each view has its own address.
// A strip never scrolls sideways: when its labels do not fit (eight tiers on a phone) it turns compact,
// each tab showing its icon or short label and sharing the width equally, the full label kept as the
// tab's name for screen readers and as its tooltip; when even that leaves a tab narrower than a tap, it
// wraps into even rows on a grid (twelve ladders as two rows of six, never seven and five).
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

const TAP = 44;

/** Turns the strip compact when its full labels would not fit, measured each time it is drawn. */
function useFit(ref: React.RefObject<HTMLElement | null>, key: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      el.removeAttribute('data-compact');
      el.removeAttribute('data-wrap');
      el.style.removeProperty('--cols');
      if (el.scrollWidth <= el.clientWidth + 1) return;
      el.setAttribute('data-compact', '');
      // Still too many for one row at a full tap's width each (twelve ladders on a phone): two rows.
      const tabs = Array.from(el.children) as HTMLElement[];
      if (el.scrollWidth > el.clientWidth + 1 || tabs.some((t) => t.getBoundingClientRect().width < TAP)) {
        // As few rows as a tap's width each allows, the tabs shared evenly between them.
        const perRow = Math.max(1, Math.floor(el.clientWidth / TAP));
        const rows = Math.ceil(tabs.length / perRow);
        el.style.setProperty('--cols', String(Math.ceil(tabs.length / rows)));
        el.setAttribute('data-wrap', '');
      }
    };
    check();
    const watch = new ResizeObserver(check);
    watch.observe(el);
    void document.fonts?.ready.then(check);
    return () => watch.disconnect();
  }, [ref, key]);
}

/**
 * `side`: a strip that becomes a list down the side when the page area is wide (the hiscores'
 * ladders): seals and names on one edge, the current tab marked by a bar on that edge, as the menu
 * marks its page.
 */
export function Tabs({
  tabs,
  label,
  onNavigate,
  variant,
}: {
  tabs: Tab[];
  label: string;
  onNavigate: (href: string) => void;
  variant?: 'side';
}) {
  const ref = useRef<HTMLElement>(null);
  useFit(ref, tabs.map((t) => t.label).join('|'));
  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(href);
  };
  return (
    <nav aria-label={label} className={s.tabs} ref={ref} data-variant={variant}>
      {tabs.map((t) => (
        <a
          key={t.href}
          href={t.href}
          data-ui="Tab"
          data-variant={variant}
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
