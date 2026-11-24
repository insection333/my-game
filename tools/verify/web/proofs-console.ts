// The admin console (session 227): signed out, /admin leads to the welcome page's sign-in, the one the
// players use (the owner: no sign-in of its own); signed in there as Admin, the console opens on Players
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
    await page.getByRole('heading', { name: 'Players', level: 1 }).waitFor({ timeout: 10_000 });
    if (asked.some((p) => p === '/api/game' || p.startsWith('/api/game/')))
      problems.push('The console loaded the game for its own account');
    step = 'each section opens from its link';
    for (const name of ['Moderation', 'Mail', 'Closed test', 'Players']) {
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
  return problems;
}
