// The one way to close what has opened over the page (session 42; the owner: every popup can be
// dismissed by a cross in its top right): sheets, moments, the tour. A cross, named for screen readers,
// drawn in the corner by whatever holds it. Verify checks every popup has one there.
import type { ButtonHTMLAttributes } from 'react';
import s from './CloseButton.module.css';

export interface CloseButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
}

export function CloseButton({ label, className, type = 'button', ...rest }: CloseButtonProps) {
  return (
    <button
      type={type}
      data-ui="CloseButton"
      data-close
      aria-label={label}
      title={label}
      className={[s.button, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true" focusable="false">
        <path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" />
      </svg>
    </button>
  );
}
