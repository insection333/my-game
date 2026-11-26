// Part of step 6, in Chromium: every view on a 390 px phone with its text set to 150% (session 199), as a
// player who asks their browser or phone for larger text sees it (24 px for the usual 16). The page is held
// to what matters most: it never scrolls sideways, nothing it draws stands past the screen's edge, and no
// words are cut short with "…". At 125% the header pushed the account off the screen, at 150% the bell too,
// and three lanes' chips cut "Old silverbark" to "Old silver-…".
import type { Page } from 'playwright';
import { measurePage } from './measure.ts';
import { openPage, views, type Served } from './session.ts';

export const LARGE_TEXT = '150%';
const ready = (page: Page) =>
  page
    .waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, { timeout: 15_000 })
    .then(() => page.waitForTimeout(300));
const WIDTH = 390;

/** Two ways larger text reaches the page: on a 390 px phone with its text at 150% (the page's own rem), and on a
 *  1,024 px screen whose browser is set to 32 px text (session 275), which also scales the breakpoints written
 *  in em. With them in px, the desktop's rail of a fixed 200 px kept "Storehouse" and "Castle Clash" cut short on
 *  every page; now that screen is laid out as the 512 px it holds. Every view at the phone; at the desktop, every
 *  view but an open sheet's (the rail and the page are what the setting moves). */
const CASES = [
  { width: WIDTH, label: `${LARGE_TEXT} text`, browser: 0, all: true },
  { width: 1024, label: 'the browser set to 32 px text', browser: 32, all: false },
] as const;

export async function runLargeTextProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  for (const c of CASES)
    for (const v of views().filter((x) => c.all || !/panel|-view-/.test(x.name))) {
      const page = await openPage('chromium', v.path, { viewport: { width: c.width, height: 844 } }, v.as);
      if (c.browser) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Page.setFontSizes', { fontSizes: { standard: c.browser, fixed: Math.round(c.browser * 0.8) } });
      } else
        await page.addInitScript((scale: string) => {
          document.addEventListener('DOMContentLoaded', () => {
            const style = document.createElement('style');
            style.textContent = `html { font-size: ${scale} !important }`;
            document.head.appendChild(style);
          });
        }, LARGE_TEXT);
      try {
        await page.goto(`${served.url}${v.path}`);
        // Measured once the page is ready, its fonts in: a fallback face is wider, and cut the lanes' names.
        await ready(page);
        // The step's own measure, held to what larger text can break: sideways scroll, things past the edge
        // or cut off by their box, words cut short.
        const m = await page.evaluate(measurePage);
        const found = [...new Set(m.problems.filter((p) => /sideways|runs off|cut short|cut off/.test(p)))].slice(0, 3);
        for (const f of found) problems.push(`At ${c.width} px with ${c.label}, ${v.name}: ${f}`);
      } catch (err) {
        problems.push(
          `At ${c.width} px with ${c.label}, ${v.name} did not open (${err instanceof Error ? err.message.split('\n')[0] : String(err)})`,
        );
      } finally {
        await page.close();
      }
    }
  return problems;
}

/** Windows' high contrast (session 200): the browser paints every background in the system's colours, so
 *  bars drawn by a fill's colour (a skill's XP, the plaque's rank, mastery, an arena's health, a foe's odds)
 *  stood empty, and every tab and menu entry wore the same underline, the one open no longer told apart.
 *  Fills keep the system's highlight and the open tab and page are marked in it. */
export async function runForcedColorProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  for (const path of ['/', '/skills/woodcutting', '/combat']) {
    const page = await openPage(
      'chromium',
      path,
      { viewport: { width: WIDTH, height: 844 }, forcedColors: 'active', colorScheme: 'dark' },
      'elder',
    );
    try {
      await page.goto(`${served.url}${path}`);
      await ready(page);
      const found = await page.evaluate(() => {
        const out: string[] = [];
        const paint = (el: Element) => getComputedStyle(el).backgroundColor;
        for (const bar of document.querySelectorAll('[data-ui="ProgressBar"]')) {
          const fill = bar.firstElementChild;
          if (fill && (paint(fill) === paint(bar) || /rgba\(0, 0, 0, 0\)|transparent/.test(paint(fill))))
            out.push(`a bar's fill is not drawn (${paint(fill)} on ${paint(bar)})`);
        }
        const marks = (sel: string) => {
          const all = [...document.querySelectorAll<HTMLElement>(sel)];
          const on = all.filter((a) => a.getAttribute('aria-current') === 'page');
          const off = all.filter((a) => a.getAttribute('aria-current') !== 'page');
          const look = (a: HTMLElement) => {
            const cs = getComputedStyle(a);
            return `${cs.borderBottomColor}|${cs.borderTopColor}|${cs.backgroundColor}|${cs.textDecorationLine}`;
          };
          if (on.length && off.length && off.some((a) => look(a) === look(on[0])))
            out.push(`the open one of ${sel} looks as the others do`);
        };
        marks('[data-ui="Tab"]');
        marks('nav[aria-label] a[href]');
        return [...new Set(out)].slice(0, 3);
      });
      for (const f of found) problems.push(`In high contrast, ${path}: ${f}`);
    } finally {
      await page.close();
    }
  }
  return problems;
}
