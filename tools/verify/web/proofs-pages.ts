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

/** A line that appears with its words already in it is said aloud (session 299): a live region read out only
 *  what changed inside it after it stood, so "Sent. Thank you.", a castle's refusal or a report sent, each drawn
 *  whole as it came, was read by some screen readers and not others. Such a line now carries `data-said`, and
 *  the page says it through one region that stands from its first moment. Feedback sent from Settings must be
 *  in that region. */
export async function runSaidProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  const page = await openPage('chromium', '/?panel=settings', { viewport: { width: 390, height: 844 } }, 'sage');
  const aloudNow = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('[aria-live]:not([aria-live="off"])'))
        .filter((el) => !el.closest('[inert]'))
        .map((el) => el.textContent ?? '')
        .join(' | '),
    );
  try {
    await page.goto(`${served.url}/?panel=settings`);
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, { timeout: 15_000 });
    const sheet = page.locator('[data-ui="Sheet"]');
    await sheet.getByRole('button', { name: 'Send feedback' }).click();
    // A field's reason for refusing is said too (session 300): it appears with its words in it, under the field.
    await sheet.getByRole('button', { name: 'Send feedback' }).click();
    await sheet.getByText('Write something first.').waitFor({ timeout: 5_000 });
    await page.waitForTimeout(300);
    const refused = await aloudNow();
    if (!refused.includes('Write something first.'))
      problems.push(`A field's refusal was not said aloud (live regions: "${refused}")`);
    await sheet.getByLabel('Your feedback').fill('The pages read well on my phone.');
    await sheet.getByRole('button', { name: 'Send feedback' }).click();
    await sheet.getByText('Sent. Thank you.').waitFor({ timeout: 10_000 });
    await page.waitForTimeout(300);
    const aloud = await aloudNow();
    if (!aloud.includes('Sent. Thank you.'))
      problems.push(`Feedback sent was not said aloud (live regions: "${aloud}")`);
  } catch (err) {
    problems.push(`Feedback could not be sent: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`);
  } finally {
    await page.close();
  }
  return problems;
}

/** A sheet shut hands the focus back to where it was opened from (session 303). Settings opened from the
 *  account menu was opened by a link the menu took away as it closed, so on Escape the focus fell to the
 *  page's body and a keyboard or screen reader player was left nowhere. Choosing a place in the menu now
 *  hands the focus to its picture, and a sheet whose opener is gone hands it to the page's heading. */
export async function runFocusBackProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  const page = await openPage('chromium', '/', { viewport: { width: 390, height: 844 } }, 'veteran');
  const focused = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      return !el || el === document.body ? 'the page itself' : (el.getAttribute('aria-label') ?? el.tagName);
    });
  try {
    await page.goto(`${served.url}/`);
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, { timeout: 15_000 });
    await page.locator('[data-ui="AccountButton"]').click();
    await page.locator('[data-ui="AccountLink"]', { hasText: 'Settings' }).click();
    await page.locator('[data-ui="Sheet"]').waitFor({ timeout: 5_000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const at = await focused();
    if (at !== 'Your account')
      problems.push(`Settings opened from the account menu and shut left the focus on ${at}, not the account`);
    // A sheet whose opener is gone (opened by its address) hands the focus to the page's heading.
    await page.goto(`${served.url}/?panel=settings`);
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, { timeout: 15_000 });
    await page.locator('[data-ui="Sheet"]').waitFor({ timeout: 5_000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const after = await page.evaluate(
      () => document.activeElement?.closest('#main') !== null && document.activeElement?.tagName === 'H1',
    );
    if (!after) problems.push(`Settings opened by its address and shut left the focus on ${await focused()}`);
  } catch (err) {
    problems.push(
      `The focus could not be followed: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`,
    );
  } finally {
    await page.close();
  }
  return problems;
}
