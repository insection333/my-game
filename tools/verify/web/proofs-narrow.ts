// Part of step 6, in Chromium: every view on the narrowest phone a player is likely to hold (session 157),
// a fold's cover screen or a small phone set to its largest display size, 280 px wide. The full checks run at
// 320, 390 and 1,440 px; here each view is held to the two that matter most: the page never scrolls
// sideways, and no words stand past the screen's right edge. At 280 px the welcome page scrolled sideways
// (its loop of pictures was 303 px), the Halls' Rank up buttons ran past their rows, and a year-in skill's
// edict pill pushed its head off the screen.
import { openPage, views, type Served } from './session.ts';

export const NARROW = 280;

export async function runNarrowProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  for (const v of views()) {
    const page = await openPage('chromium', v.path, { viewport: { width: NARROW, height: 653 } }, v.as);
    try {
      await page.goto(`${served.url}${v.path}`);
      await page.waitForTimeout(600);
      const found = await page.evaluate(() => {
        const out: string[] = [];
        const root = document.documentElement;
        if (root.scrollWidth > root.clientWidth + 1) out.push(`scrolls sideways (${root.scrollWidth} px wide)`);
        for (const el of document.querySelectorAll<HTMLElement>('body *')) {
          const box = el.getBoundingClientRect();
          // Words a reader sees: not hidden for screen readers alone, not inside a box marked to scroll.
          if (box.width <= 2 || box.height <= 2 || el.children.length || el.closest('[data-scrolls]')) continue;
          const words = (el.textContent ?? '').trim();
          if (words && box.right > innerWidth + 1) out.push(`"${words.slice(0, 40)}" ends ${Math.round(box.right)} px`);
        }
        return out.slice(0, 3);
      });
      for (const f of found) problems.push(`At ${NARROW} px, ${v.name}: ${f}`);
    } catch (err) {
      problems.push(
        `At ${NARROW} px, ${v.name} did not open (${err instanceof Error ? err.message.split('\n')[0] : String(err)})`,
      );
    } finally {
      await page.close();
    }
  }
  return problems;
}
