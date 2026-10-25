// A sheet for a panel over the page: the notices tray, settings, an item, a lane. Rises from the
// bottom on phones and slides in from the right on wide screens. Escape or the close button shuts it.
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button.tsx';
import s from './Sheet.module.css';

export interface SheetProps {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  /** The slot this sheet shows, for the tour and the checks. */
  slot?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function Sheet({ title, closeLabel, onClose, children, slot }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);
  // The latest onClose, so the page drawing again (every second while lanes work) neither moves the
  // focus nor sets the keys up again.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close.current();
      // Tab stays inside the sheet, as a modal dialog's should.
      if (e.key !== 'Tab' || !ref.current) return;
      const all = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!all.length) return;
      const [first, last] = [all[0], all[all.length - 1]];
      const at = document.activeElement;
      if (e.shiftKey && (at === first || at === ref.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && at === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      before?.focus();
    };
  }, []);
  return (
    <div className={s.layer}>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        data-ui="Sheet"
        data-slot={slot}
        className={s.sheet}
      >
        <div className={s.head}>
          <h2 className={s.title}>{title}</h2>
          <Button variant="quiet" onClick={onClose}>
            {closeLabel}
          </Button>
        </div>
        <div className={s.body}>{children}</div>
      </div>
    </div>
  );
}
