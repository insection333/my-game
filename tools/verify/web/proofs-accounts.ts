// Part of step 6, in Chromium: session 9's proofs in the page itself.
// - The recap leads with the best thing: the veteran, back after 8 hours, sees the recap's lines best
//   first; Collect closes it, and its moments wait in the notices tray.
// - A deleted account leaves nothing: a player deletes theirs from Settings, lands on the welcome
//   page, and no table in the database holds their id or their name any more.
// - An admin can reset a password: the veteran (an admin here) sets a new password for a player on
//   the admin page, on a phone; the player signs in with it. Open brings the player's panel into view
//   (session 94: on a phone it opened below every other panel, and Open looked dead). The player then
//   changes it to one of their own in Settings (session 105: there was no way to) and signs in with that.
// - The longest name keeps a sheet's cross in view (session 112): sixteen W's, one unbroken word, as the
//   title of the player's own profile card on a phone ran past the sheet's edge and over its cross; and
//   scrolled to its foot (session 114), the card's picture was drawn over its header and the name.
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
    await page.getByRole('button', { name: /^Notices: \d+ new notices?$/ }).waitFor({ timeout: 10_000 });
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
  const admin = await openPage('chromium', '/admin', { viewport: { width: 390, height: 844 } }, 'veteran');
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
    step = "the player's panel comes into view";
    const panel = admin.locator('[data-slot="admin.player"]');
    await panel.waitFor({ timeout: 10_000 });
    await admin.waitForFunction(
      () => {
        const r = document.querySelector('[data-slot="admin.player"]')?.getBoundingClientRect();
        return !!r && r.top >= 0 && r.top < innerHeight - 80;
      },
      undefined,
      { timeout: 3_000 },
    );
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
  let step2 = 'the player signs in with the new password';
  try {
    await back.locator('[data-slot="hearth.goals"]').waitFor({ timeout: 15_000 });
    step2 = 'Settings changes it to their own';
    await back.goto(served.url + '/?panel=settings');
    await back.getByRole('button', { name: 'Change password' }).click();
    await back.getByLabel('Current password').fill(password);
    await back.getByLabel('New password').fill('my own long secret');
    await back.getByRole('button', { name: 'Change password' }).click();
    await back.getByText('Password changed.').waitFor({ timeout: 10_000 });
  } catch (err) {
    problems.push(`Admin: failed where ${step2} (${say(err)})`);
  } finally {
    await back.close();
  }
  const own = await signsIn(served, 'Forgetful', 'my own long secret');
  try {
    await own.locator('[data-slot="hearth.goals"]').waitFor({ timeout: 15_000 });
  } catch (err) {
    problems.push(`Admin: the player could not sign in with the password they chose (${say(err)})`);
  } finally {
    await own.close();
  }
}

async function longNameKeepsTheCross(served: Served, problems: string[]) {
  const name = 'WWWWWWWWWWWWWWWW';
  const page = await playerWith(served, name, `/hiscores?panel=player&name=${name}`, (s) => s);
  try {
    await page.setViewportSize({ width: 320, height: 700 });
    const sheet = page.locator('[role="dialog"]').last();
    await sheet.getByRole('heading', { name }).first().waitFor({ timeout: 10_000 });
    const found = await sheet.evaluate((d, n) => {
      const box = d.getBoundingClientRect();
      const title = [...d.querySelectorAll('h1, h2, h3')].find((h) => h.textContent === n);
      const cross = d.querySelector('button[aria-label="Close"]');
      if (!title || !cross) return 'no title or no cross';
      const t = title.getBoundingClientRect();
      const c = cross.getBoundingClientRect();
      const hit = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
      if (t.right > box.right + 0.5) return `its title runs ${Math.round(t.right - box.right)} px past the sheet`;
      if (!hit || !cross.contains(hit)) return 'its cross is covered';
      return null;
    }, name);
    if (found) problems.push(`A profile card for the longest name on a phone: ${found}`);
    // Another's card is the long one (their places, Report this player): the crowd's longest name.
    const other = 'MightyWoodwarden';
    await page.goto(`${served.url}/hiscores?panel=player&name=${other}`);
    const card = page.locator('[role="dialog"]').last();
    await card.getByText('Report this player').waitFor({ timeout: 10_000 });
    const underPicture = await card.evaluate(async (d) => {
      // Down the whole card in steps, the header must be what lies under every point across it.
      const head = d.firstElementChild as HTMLElement;
      for (let top = 0; top <= d.scrollHeight; top += 40) {
        d.scrollTop = top;
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const h = head.getBoundingClientRect();
        for (let x = h.left + 8; x < h.right - 8; x += 16)
          for (const y of [h.top + 4, h.top + h.height / 2, h.bottom - 4]) {
            const hit = document.elementFromPoint(x, y);
            if (hit && !head.contains(hit)) return true;
          }
      }
      return false;
    });
    if (underPicture) problems.push('A profile card scrolled to its foot draws over its own header');
  } catch (err) {
    problems.push(`A profile card for the longest name did not open (${say(err)})`);
  } finally {
    await page.close();
  }
}

export async function runAccountProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  await recapBestFirst(served, problems);
  await deleteLeavesNothing(served, problems);
  await adminResetsPassword(served, problems);
  await longNameKeepsTheCross(served, problems);
  return problems;
}
