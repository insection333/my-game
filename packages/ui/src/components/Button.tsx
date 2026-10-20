// The one button. Primary starts things; secondary is the quieter second choice; quiet sits inline.
import type { ButtonHTMLAttributes } from 'react';
import s from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet';
}

export function Button({ variant = 'secondary', className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      data-ui="Button"
      data-variant={variant}
      className={[s.button, s[variant], className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
