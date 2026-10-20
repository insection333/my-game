// Part of step 6: the account flows a player walks through, done in the page itself (Chromium):
// sent to the welcome page, refused with a reason, signed up, a lane kept by the server across a
// reload, signed out, refused a wrong password, signed back in.
import { openPage } from './session.ts';

const NAME = 'Flow Walker';
const PASSWORD = 'a long enough secret';

export async function runFlows(base: string): Promise<{ problems: string[]; steps: number }> {
  const problems: string[] = [];
  let steps = 0;
  const page = await openPage('chromium', '/welcome', { viewport: { width: 390, height: 844 } });
  page.on('pageerror', (e) => problems.push(`script error: ${e.message}`));
  const ready = () => page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  const expect = async (what: string, check: () => Promise<boolean>) => {
    steps++;
    const ok = await check().catch(() => false);
    if (!ok) problems.push(`Flow: ${what}`);
    return ok;
  };
  const path = () => new URL(page.url()).pathname + new URL(page.url()).search;

  try {
    await page.goto(`${base}/skills`);
    await ready();
    await expect('a visitor to /skills is sent to the welcome page, keeping where they were going', async () =>
      Promise.resolve(path() === '/welcome?next=%2Fskills'),
    );

    await page.getByRole('button', { name: 'Create account' }).click();
    await expect('an empty form says what the name needs', () =>
      page.getByText('Use 3 to 16 letters or digits').isVisible(),
    );

    await page.getByLabel('Name').fill(NAME);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByLabel('I am 13 or older').check();
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForURL(`${base}/skills`);
    await expect('signing up lands on the page asked for, inside the shell', () =>
      page.locator('[data-slot="shell.fire"]').isVisible(),
    );

    await page.goto(`${base}/skills/woodcutting`);
    await ready();
    const sent = page.waitForResponse((r) => r.url().endsWith('/api/game/command'));
    await page.getByRole('button', { name: 'Start' }).first().click();
    await sent;
    await page.reload();
    await ready();
    await expect('a started lane is kept by the server across a reload', () =>
      page.evaluate(async () => {
        const g = (await (await fetch('/api/game')).json()) as {
          state: { lanes: { gathering: { current: unknown } } };
        };
        return g.state.lanes.gathering.current !== null;
      }),
    );

    await page.goto(`${base}/?panel=settings`);
    await ready();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL(`${base}/welcome/sign-in`);
    await expect('signing out ends the session', () =>
      page.evaluate(async () => (await fetch('/api/game')).status === 401),
    );

    await page.getByLabel('Name').fill(NAME.toLowerCase());
    await page.getByLabel('Password').fill('not the password');
    await page.getByRole('button', { name: 'Sign in' }).last().click();
    await expect('a wrong password is refused with a reason', async () => {
      await page.getByRole('alert').waitFor();
      return (await page.getByRole('alert').textContent()) === 'That name and password do not match.';
    });

    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).last().click();
    await page.waitForURL(`${base}/`);
    await expect('signing in, in any case of the name, opens the Hearth', () =>
      page.locator('[data-slot="hearth.today"]').isVisible(),
    );
  } catch (err) {
    problems.push(`Flow stopped at ${path()}: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`);
  } finally {
    await page.close();
  }
  return { problems, steps };
}
