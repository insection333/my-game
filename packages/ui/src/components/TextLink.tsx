// A link inside text (Privacy, Terms, Back): underlined, in the link colour, tall enough to tap.
// Links within the game navigate without reloading; the page passes `onNavigate`.
import type { MouseEvent, ReactNode } from 'react';
import s from './TextLink.module.css';

export function TextLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  onNavigate?: (href: string) => void;
}) {
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!onNavigate || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(href);
  };
  return (
    <a href={href} data-ui="TextLink" className={s.link} onClick={go}>
      {children}
    </a>
  );
}
