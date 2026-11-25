// The console's first password (session 237): while the console's account holds it, signing in on a phone
// opens nothing but Choose your own password, with no sections to wander to; choosing one opens the
// Overview. Then Your password, from the name in the bar, changes it back, and the run's console session is
// signed in afresh (a change signs the console out everywhere else).
import { openPage, staffIn, type Served } from './session.ts';

const say = (err: unknown) => (err instanceof Error ? err.message.split('\n')[0] : String(err));
const MINE = 'a password of my own';

export async function runFirstPasswordProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  const original = served.ctx.config.staff.password!;
  const must = (on: boolean) =>
    served.ctx.store.sqlite.prepare("update players set must_change_password = ? where name = 'Admin'").run(on ? 1 : 0);
  must(true);
  const page = await openPage('chromium', '/welcome/sign-in', { viewport: { width: 390, height: 844 } }, 'visitor');
  let step = 'Admin signs in holding the first password';
  try {
    await page.goto(served.url + '/welcome/sign-in');
    await page.getByLabel('Name').fill('Admin');
    await page.getByLabel('Password').fill(original);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('heading', { name: 'Choose your own password', level: 1 }).waitFor({ timeout: 10_000 });
    if (await page.getByRole('navigation', { name: 'Console sections' }).count())
      problems.push('The console: its sections stand beside the first password');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      problems.push('The console: Choose your own password scrolls sideways on a phone');
    step = 'choosing one opens the console';
    await page.getByLabel('The first password').fill(original);
    await page.getByLabel('New password', { exact: true }).fill(MINE);
    await page.getByLabel('The new password again').fill(MINE);
    await page.getByRole('button', { name: 'Save the password' }).click();
    await page.getByRole('heading', { name: 'Overview', level: 1 }).waitFor({ timeout: 10_000 });
    step = 'Your password changes it back';
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('link', { name: 'Signed in as Admin' }).click();
    await page.getByRole('heading', { name: 'Your password', level: 1 }).waitFor({ timeout: 10_000 });
    await page.getByLabel('Current password').fill(MINE);
    await page.getByLabel('New password', { exact: true }).fill(original);
    await page.getByLabel('The new password again').fill(original);
    await page.getByRole('button', { name: 'Save the password' }).click();
    await page.getByRole('status').getByText('Saved.').waitFor({ timeout: 10_000 });
  } catch (err) {
    problems.push(`The console's first password: ${step} failed (${say(err)})`);
  } finally {
    await page.close();
    must(false);
    // The change signed the run's console session out: it signs in afresh for what comes after.
    served.staff = await staffIn(served.url, original).catch(() => served.staff);
  }
  return problems;
}
