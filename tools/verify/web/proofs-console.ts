// The admin console (session 227): signed out, /admin leads to the welcome page's sign-in, the one the
// players use (the owner: no sign-in of its own); signed in there as Admin, the console opens on its Overview
// without the game ever loading, each section opens from its link, and Sign out comes back to the form.
import { openPage, type Served } from './session.ts';

const say = (err: unknown) => (err instanceof Error ? err.message.split('\n')[0] : String(err));

export async function runConsoleProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  const page = await openPage('chromium', '/admin', { viewport: { width: 390, height: 844 } }, 'visitor');
  const asked: string[] = [];
  page.on('request', (r) => asked.push(new URL(r.url()).pathname));
  let step = '/admin leads to the sign-in';
  try {
    await page.goto(served.url + '/admin');
    await page.waitForURL((u) => u.pathname.startsWith('/welcome'), { timeout: 10_000 });
    await page.getByRole('link', { name: 'Sign in' }).click();
    step = "Admin signs in on the players' form";
    await page.getByLabel('Name').fill('Admin');
    await page.getByLabel('Password').fill(served.ctx.config.staff.password!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('heading', { name: 'Overview', level: 1 }).waitFor({ timeout: 10_000 });
    if (asked.some((p) => p === '/api/game' || p.startsWith('/api/game/')))
      problems.push('The console loaded the game for its own account');
    step = 'each section opens from its link';
    for (const name of ['Players', 'Moderation', 'Mail', 'Live', 'Closed test', 'Audit log', 'System', 'Overview']) {
      await page.getByRole('navigation', { name: 'Console sections' }).getByRole('link', { name }).click();
      await page.getByRole('heading', { name, level: 1 }).waitFor({ timeout: 10_000 });
    }
    step = 'Sign out comes back to the sign-in';
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL((u) => u.pathname === '/welcome/sign-in', { timeout: 10_000 });
  } catch (err) {
    problems.push(`The console: ${step} failed (${say(err)})`);
  } finally {
    await page.close();
  }
  return [...problems, ...(await pressProofs(served))];
}

/** Session 231: a double click on Give gives once (it gave twice), and Back to an earlier search of the
 *  players puts that search back in its box (the box kept the last typed). */
async function pressProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  const page = await openPage('chromium', '/admin', { viewport: { width: 1440, height: 900 } }, 'staff');
  let step = 'Back restores the search';
  try {
    await page.goto(served.url + '/admin/players');
    const box = page.getByLabel('Player name');
    await box.fill('Keep');
    await box.press('Enter');
    await page.waitForURL((u) => u.search.includes('q=Keep'));
    await page.goBack();
    await page.waitForURL((u) => !u.search.includes('q='));
    if ((await box.inputValue()) !== '') problems.push('The console: Back to all players kept "Keep" in the search');
    step = 'a double click on Give gives once';
    await page.goto(served.url + '/admin/players/@Keeper?tab=grants');
    await page.getByLabel('Item').fill('Gold');
    await page.getByLabel('How many').fill('7');
    await page.getByLabel('Reason').first().fill('proof of one press');
    await page.getByRole('button', { name: 'Give', exact: true }).dblclick();
    await page.getByText(/they now hold/).waitFor({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.goto(served.url + '/admin/audit?q=proof%20of%20one%20press');
    await page.getByRole('table').waitFor({ timeout: 10_000 });
    const gave = await page.getByRole('row').filter({ hasText: 'proof of one press' }).count();
    if (gave !== 1) problems.push(`The console: a double click on Give gave ${gave} times`);
    // Session 233: Ctrl K opens Go to from any section; a name typed finds the player, and Enter opens them.
    step = 'Go to finds a player';
    await page.goto(served.url + '/admin/system');
    await page.locator('h1').waitFor();
    await page.keyboard.press('Control+k');
    await page.getByLabel('A section or a player').fill('Keep');
    await page.getByRole('dialog').getByRole('link', { name: 'Keeper', exact: true }).waitFor({ timeout: 10_000 });
    await page.keyboard.press('Enter');
    await page.waitForURL((u) => /\/admin\/players\/[0-9a-f-]{36}$/.test(u.pathname));
    await page.getByRole('heading', { name: 'Keeper' }).waitFor({ timeout: 10_000 });
    step = 'Go to on a 320 px phone';
    await page.setViewportSize({ width: 320, height: 640 });
    await page.keyboard.press('/');
    await page.getByRole('dialog').waitFor();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      problems.push('The console: Go to scrolls sideways on a 320 px phone');
  } catch (err) {
    problems.push(`The console: ${step} failed (${say(err)})`);
  } finally {
    await page.close();
  }
  return problems;
}
