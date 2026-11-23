// Part of step 6, in Chromium: a phone's notch, rounded corners and home bar (session 206). The page asks
// to be drawn edge to edge (viewport-fit=cover), so on an iPhone on its side the notch and corners stand
// over 47 px of each side, and its home bar over the foot of the screen, which the page reads as safe-area
// insets; but only the menu kept clear of the home bar. On its side the rail's glyphs and the page's words
// ran under the notch, and a sheet's last button stood under the home bar however far it was scrolled.
// The screen's insets are set as an iPhone 15's report them, in both holds, and nothing the player reads or
// presses may stand in them.
import type { Page } from 'playwright';
import { openPage, type Served } from './session.ts';

interface Hold {
  name: string;
  width: number;
  height: number;
  insets: { top: number; right: number; bottom: number; left: number };
}
const HOLDS: Hold[] = [
  { name: 'upright', width: 393, height: 852, insets: { top: 59, right: 0, bottom: 34, left: 0 } },
  { name: 'on its side', width: 852, height: 393, insets: { top: 0, right: 59, bottom: 21, left: 59 } },
];
const PATHS: [string, 'veteran' | 'visitor'][] = [
  ['/', 'visitor'],
  ['/', 'veteran'],
  ['/skills/woodcutting', 'veteran'],
  ['/combat', 'veteran'],
  ['/castle', 'veteran'],
  ['/storehouse', 'veteran'],
  ['/?panel=settings', 'veteran'],
];

/** What the player reads or presses that stands in the insets, as short descriptions. */
const intruders = (page: Page, insets: Hold['insets']) =>
  page.evaluate((i) => {
    const W = innerWidth;
    const H = innerHeight;
    const out: string[] = [];
    const shown = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        cs.visibility !== 'hidden' &&
        r.bottom > 0 &&
        r.top < H &&
        r.right > 0 &&
        r.left < W
      );
    };
    const what = (el: Element) =>
      `${el.tagName.toLowerCase()} "${(el.textContent ?? el.getAttribute('aria-label') ?? '').trim().slice(0, 30)}"`;
    // Controls, and the words of leaf elements.
    const els = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="tab"]')].concat(
      [...document.querySelectorAll('body *')].filter(
        (el) => el.children.length === 0 && (el.textContent ?? '').trim() && !el.closest('.visually-hidden'),
      ),
    );
    for (const el of els) {
      if (!shown(el) || el.closest('[aria-hidden="true"]')) continue;
      const r = el.getBoundingClientRect();
      // What scrolls (the page, a sheet) goes on under the foot: only what is fixed there is held to it here,
      // and each scroller's end below.
      const scrolls = (() => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          const o = getComputedStyle(p).overflowY;
          if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight + 1) return true;
        }
        return document.documentElement.scrollHeight > H + 1;
      })();
      if (r.left < i.left - 0.5) out.push(`${what(el)} stands ${Math.round(i.left - r.left)} px into the left inset`);
      else if (r.right > W - i.right + 0.5)
        out.push(`${what(el)} stands ${Math.round(r.right - (W - i.right))} px into the right inset`);
      else if (r.top < i.top - 0.5 && r.bottom > 0) out.push(`${what(el)} stands under the top inset`);
      else if (!scrolls && r.bottom > H - i.bottom + 0.5)
        out.push(`${what(el)} stands ${Math.round(r.bottom - (H - i.bottom))} px into the foot's inset`);
    }
    return [...new Set(out)].slice(0, 3);
  }, insets);

export async function runSafeAreaProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  for (const hold of HOLDS) {
    for (const [path, as] of PATHS) {
      const page = await openPage('chromium', path, { viewport: { width: hold.width, height: hold.height } }, as);
      try {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: hold.insets });
        await page.goto(`${served.url}${path}`);
        await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, {
          timeout: 15_000,
        });
        await page.waitForTimeout(400);
        const fixed = await intruders(page, hold.insets);
        // Each scroller (the page, a sheet, the page area) is read to its end: its last control must then
        // clear the home bar.
        const ends = await page.evaluate((bottom) => {
          const out: string[] = [];
          const scrollers = [document.scrollingElement!, ...document.querySelectorAll('body *')].filter((el) => {
            const o = el === document.scrollingElement ? 'auto' : getComputedStyle(el).overflowY;
            return (o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 1;
          });
          for (const el of scrollers) el.scrollTop = el.scrollHeight;
          for (const el of scrollers) {
            const controls = [...el.querySelectorAll('button, a[href], input')].filter((c) => {
              const r = c.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            });
            const last = controls.at(-1);
            if (!last) continue;
            const r = last.getBoundingClientRect();
            if (r.bottom > innerHeight - bottom + 0.5)
              out.push(
                `the last control of what scrolls ("${(last.textContent ?? '').trim().slice(0, 30)}") stays ${Math.round(r.bottom - (innerHeight - bottom))} px in the foot's inset at its end`,
              );
          }
          return out;
        }, hold.insets.bottom);
        for (const f of [...fixed, ...ends]) problems.push(`On a phone ${hold.name}, ${path} (${as}): ${f}`);
      } catch (err) {
        problems.push(
          `On a phone ${hold.name}, ${path} did not open (${err instanceof Error ? err.message.split('\n')[0] : String(err)})`,
        );
      } finally {
        await page.close();
      }
    }
  }
  return problems;
}
