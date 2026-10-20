// A button that is only a glyph (the notices bell, the account). Always named for screen readers.
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import s from './IconButton.module.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  children: ReactNode;
  /** A small count shown on the glyph, such as new notices. */
  badge?: string;
}

export function IconButton({ label, children, badge, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      data-ui="IconButton"
      aria-label={label}
      title={label}
      className={[s.button, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
      {badge && (
        <span className={s.badge} aria-hidden="true">
          {badge}
        </span>
      )}
    </button>
  );
}
