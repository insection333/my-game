// Part of step 6, in Chromium (session 296): a page changed in place says so. The tab, the history list and a
// screen reader all read "Idle Clash" whatever page was open, and a page opened from the menu kept the focus
// on the menu, so a screen reader heard nothing of the page it came to. Each page now names the tab after its
// heading ("Combat · Idle Clash"), and a page opened in place takes the focus to its heading; Back does too.
import { openPage, type Served } from './session.ts';

const STEPS: { link: string; title: string }[] = [
  { link: 'Combat', title: 'Combat · Idle Clash' },
  { link: 'Skills', title: 'Skills · Idle Clash' },
  { link: 'Storehouse', title: 'Storehouse · Idle Clash' },
];

export async function runPageNameProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  const page = await openPage('chromium', '/', { viewport: { width: 1440, height: 900 } }, 'veteran');
  const focusedHeading = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName === 'H1' && el.closest('#main') ? (el.textContent ?? '') : null;
    });
  try {
    await page.goto(`${served.url}/`);
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, { timeout: 15_000 });
    await page.waitForTimeout(300);
    if ((await page.title()) !== 'Hearth · Idle Clash') problems.push(`The Hearth's tab read "${await page.title()}"`);
    for (const { link, title } of STEPS) {
      await page.getByRole('navigation').getByRole('link', { name: link, exact: true }).click({ timeout: 5_000 });
      await page.waitForTimeout(400);
      if ((await page.title()) !== title) problems.push(`${link}'s tab read "${await page.title()}", not "${title}"`);
      if (!(await focusedHeading())) problems.push(`${link} opened from the menu left the focus off its heading`);
    }
    await page.goBack();
    await page.waitForTimeout(400);
    if ((await page.title()) !== 'Skills · Idle Clash')
      problems.push(`Back to Skills, the tab read "${await page.title()}"`);
  } catch (err) {
    problems.push(
      `The pages' names could not be read: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`,
    );
  } finally {
    await page.close();
  }
  return problems;
}
