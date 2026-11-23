// A browser too old for the game, or with its scripts off (session 207). The game is built for browsers from
// 2022 on (Safari 15.4, Chrome 98, Firefox 104: `structuredClone`, `Object.hasOwn`, `findLast`); an older
// one (a family's iPad held at iOS 12 or 15) failed on the game's first line and showed a blank page for
// ever, and so did a browser with scripts switched off. A small classic script, written for the oldest
// browsers and run before the game, now says so in the page, and a <noscript> line says it where scripts
// are off. Built into the page by the Vite plugin in vite.config.ts; the words come from the strings file.
import { t } from '@idle-clash/content';

/** What a browser must have for the game to run: what the build uses that came last, in 2022. */
export const NEEDS = [
  "typeof structuredClone === 'function'",
  "typeof Object.hasOwn === 'function'",
  "typeof [].findLast === 'function'",
  "typeof Intl === 'object' && typeof Intl.ListFormat === 'function'",
];

const box = 'max-width:32rem;margin:15vh auto 0;padding:0 16px;font:1.125rem/1.5 system-ui,sans-serif';

/** The classic script, served as /old-browser.js before the game's own: in ES5, as the oldest can read. */
export function oldBrowserJs(): string {
  return `(function () {
  if (${NEEDS.join(' && ')}) return;
  document.documentElement.setAttribute('data-too-old', 'true');
  function say() {
    var root = document.getElementById('root');
    if (!root) return;
    var p = document.createElement('p');
    p.setAttribute('style', ${JSON.stringify(box)});
    p.textContent = ${JSON.stringify(t('browser.tooOld'))};
    root.innerHTML = '';
    root.appendChild(p);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', say);
  else say();
})();
`;
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** What the page's body carries for these browsers: the line for scripts off, and the script above. */
export function oldBrowserHtml(): string {
  return `<noscript><p style="${box}">${escape(t('browser.noScript'))}</p></noscript>\n    <script src="/old-browser.js"></script>`;
}
