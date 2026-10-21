// Part of step 6, in Chromium: session 9's proofs in the page itself.
// - The recap leads with the best thing: the veteran, back after 8 hours, sees the recap's lines best
//   first; Collect closes it, and its moments wait in the notices tray.
// - A deleted account leaves nothing: a player deletes theirs from Settings, lands on the welcome
//   page, and no table in the database holds their id or their name any more.
// - An admin can reset a password: the veteran (an admin here) sets a new password for a player on
//   the admin page; the player signs in with it.
import { recap } from '@idle-clash/features';
import type { Page } from 'playwright';
import { playerWith, say } from './proofs-lanes.ts';
import { openPage, type Served } from './session.ts';

const rank = (k: string) => recap.RECAP_ORDER.indexOf(k as recap.RecapKind);

async function recapBestFirst(served: Served, problems: string[]) {
  const page = await openPage('chromium', '/', { viewport: { width: 390, height: 844 } }, 'veteran');
  let step = 'the recap shows';
  try {
    await page.goto(served.url + '/');
    const lines = page.locator('[data-slot="hearth.today"] [data-recap] li');
    await lines.first().waitFor({ timeout: 15_000 });
    const kinds = await lines.evaluateAll((els) => els.map((e) => e.getAttribute('data-kind') ?? ''));
    step = 'its lines lead with the best';
    const good = kinds.filter((k) => k !== 'stopped');
    if (good.length < 3) problems.push(`Recap: ${good.length} good things after 8 hours away (at least 3)`);
    if (!kinds.every((k, i) => i === 0 || rank(k) >= rank(kinds[i - 1])))
      problems.push(`Recap: its lines are not best first (${kinds.join(', ')})`);
    step = 'Collect closes it and the tray holds its moments';
    await page.getByRole('button', { name: 'Collect' }).click();
    await page.locator('[data-recap]').waitFor({ state: 'detached', timeout: 5_000 });
    await page.getByRole('button', { name: /^Notices: \d+ new notices$/ }).waitFor({ timeout: 10_000 });
  } catch (err) {
    problems.push(`Recap: failed where ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
}

/** Every row of every table, as text: what the database holds. */
const everything = (served: Served) =>
  (served.ctx.store.sqlite.prepare("select name from sqlite_master where type = 'table'").all() as { name: string }[])
    .map((t) => JSON.stringify(served.ctx.store.sqlite.prepare(`select * from "${t.name}"`).all()))
    .join('\n');

async function deleteLeavesNothing(served: Served, problems: string[]) {
  const name = 'Leaving Soon';
  const page = await playerWith(served, name, '/?panel=settings', (s) => s);
  let step = 'the player is in the database';
  try {
    const me = (await page.evaluate(() => fetch('/api/me').then((r) => r.json()))) as { player: { id: string } };
    if (!everything(served).includes(me.player.id)) problems.push('Delete: the new player is not in the database');
    step = 'Settings deletes the account';
    await page.getByRole('button', { name: 'Delete account' }).click();
    await page.getByLabel('Your password').fill('verify-newcomer-pass');
    await page.getByRole('button', { name: 'Delete everything' }).click();
    step = 'the welcome page opens';
    await page.waitForURL(/\/welcome$/, { timeout: 10_000 });
    const left = everything(served);
    if (left.includes(me.player.id) || left.toLowerCase().includes(name.toLowerCase()))
      problems.push('Delete: the database still holds the deleted player');
  } catch (err) {
    problems.push(`Delete: failed where ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
}

async function signsIn(served: Served, name: string, password: string): Promise<Page> {
  const page = await openPage('chromium', '/welcome/sign-in', { viewport: { width: 390, height: 844 } }, 'visitor');
  await page.goto(served.url + '/welcome/sign-in');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  return page;
}

async function adminResetsPassword(served: Served, problems: string[]) {
  const forgetful = await playerWith(served, 'Forgetful', '/', (s) => s);
  await forgetful.close();
  const admin = await openPage('chromium', '/admin', { viewport: { width: 1440, height: 900 } }, 'veteran');
  let step = 'the admin page finds the player';
  let password = '';
  try {
    await admin.goto(served.url + '/admin');
    await admin.getByLabel('Player name').fill('forget');
    await admin.getByRole('button', { name: 'Find' }).click();
    await admin
      .locator('[data-ui="ActionRow"]', { hasText: 'Forgetful' })
      .getByRole('button', { name: 'Open' })
      .click();
    step = 'it sets a new password';
    await admin.getByRole('button', { name: 'Set a new password' }).click();
    password = ((await admin.locator('[data-password] code').textContent({ timeout: 10_000 })) ?? '').trim();
  } catch (err) {
    problems.push(`Admin: failed where ${step} (${say(err)})`);
  } finally {
    await admin.close();
  }
  if (!password) return;
  const back = await signsIn(served, 'Forgetful', password);
  try {
    await back.locator('[data-slot="hearth.goals"]').waitFor({ timeout: 15_000 });
  } catch (err) {
    problems.push(`Admin: the player could not sign in with the new password (${say(err)})`);
  } finally {
    await back.close();
  }
}

export async function runAccountProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  await recapBestFirst(served, problems);
  await deleteLeavesNothing(served, problems);
  await adminResetsPassword(served, problems);
  return problems;
}
