// A page changed in place says so (session 296). The tab, the history list and a screen reader all read "Idle
// Clash" whatever page was open, and a page opened from the menu left the focus on the menu, so a screen reader
// heard nothing of the page it came to. The tab is named after the page's heading ("Combat · Idle Clash"), and
// a page opened in place (the menu, a link, Back) takes the focus to its heading, as a page loaded afresh would
// be read from its top.
import { t } from '@idle-clash/content';
import { useEffect, useRef } from 'react';

/** How long a page may take to draw its heading (a part of the page fetched on its first opening). */
const TRIES = 20;
const EVERY_MS = 100;

export function usePageName(path: string): void {
  const first = useRef(true);
  useEffect(() => {
    const opened = !first.current;
    first.current = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settle = () => {
      const heading = document.querySelector<HTMLElement>('#main h1');
      if (!heading && ++tries < TRIES) {
        timer = setTimeout(settle, EVERY_MS);
        return;
      }
      const name = heading?.textContent?.trim();
      document.title = name ? t('shell.pageTitle', { page: name }) : t('shell.name');
      if (opened && heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    };
    settle();
    return () => clearTimeout(timer);
  }, [path]);
}
