// Part of step 6, in Chromium: every view on a 390 px phone with its text set to 150% (session 199), as a
// player who asks their browser or phone for larger text sees it (24 px for the usual 16). The page is held
// to what matters most: it never scrolls sideways, nothing it draws stands past the screen's edge, and no
// words are cut short with "…". At 125% the header pushed the account off the screen, at 150% the bell too,
// and three lanes' chips cut "Old silverbark" to "Old silver-…".
import { measurePage } from './measure.ts';
import { openPage, views, type Served } from './session.ts';

export const LARGE_TEXT = '150%';
const WIDTH = 390;

export async function runLargeTextProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  for (const v of views()) {
    const page = await openPage('chromium', v.path, { viewport: { width: WIDTH, height: 844 } }, v.as);
    await page.addInitScript((scale: string) => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = `html { font-size: ${scale} !important }`;
        document.head.appendChild(style);
      });
    }, LARGE_TEXT);
    try {
      await page.goto(`${served.url}${v.path}`);
      await page.waitForTimeout(600);
      // The step's own measure, held to what larger text can break: sideways scroll, things past the edge
      // or cut off by their box, words cut short.
      const m = await page.evaluate(measurePage);
      const found = [...new Set(m.problems.filter((p) => /sideways|runs off|cut short|cut off/.test(p)))].slice(0, 3);
      for (const f of found) problems.push(`At ${WIDTH} px with ${LARGE_TEXT} text, ${v.name}: ${f}`);
    } catch (err) {
      problems.push(
        `At ${WIDTH} px with ${LARGE_TEXT} text, ${v.name} did not open (${err instanceof Error ? err.message.split('\n')[0] : String(err)})`,
      );
    } finally {
      await page.close();
    }
  }
  return problems;
}
