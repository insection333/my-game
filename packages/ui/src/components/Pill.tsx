// A short status label. Its tone adds colour; its words carry the meaning.
import type { ReactNode } from 'react';
import s from './Pill.module.css';

export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'moss' | 'woad' | 'gold' | 'ember';
  children: ReactNode;
}) {
  return (
    <span data-ui="Pill" data-tone={tone} className={`${s.pill} ${s[tone]}`}>
      {children}
    </span>
  );
}
