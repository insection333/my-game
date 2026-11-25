// The realm's banner (session 235): put up from the console's Live section, it stands across the top of the
// game for every player, fits a 320 px phone, is put away by its cross and stays away on reload for that
// player alone, and goes from an open page the moment it is taken down. Taken down at the end whatever
// happens, so no view after this one wears it.
import { join } from 'node:path';
import { ROOT } from '../exec.ts';
import { openPage, type Served } from './session.ts';

const say = (err: unknown) => (err instanceof Error ? err.message.split('\n')[0] : String(err));
const TEXT = 'The realm rests from 22:00 to 22:30 UTC tonight while the keepers mend the roads.';

export async function runBannerProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  const admin = await openPage('chromium', '/admin/live', { viewport: { width: 1440, height: 900 } }, 'staff');
  const phone = await openPage('chromium', '/', { viewport: { width: 320, height: 640 } }, 'veteran');
  const wide = await openPage('chromium', '/', { viewport: { width: 1440, height: 900 } }, 'elder');
  let step = 'the console puts the banner up';
  try {
    await admin.goto(served.url + '/admin/live');
    await admin.getByLabel('The banner').fill(TEXT);
    await admin.getByRole('button', { name: 'A day', exact: true }).click();
    await admin.getByRole('button', { name: 'Put it up' }).click();
    await admin.getByText(/^Standing until/).waitFor({ timeout: 10_000 });
    step = 'a phone shows it whole';
    await phone.goto(served.url + '/');
    const banner = phone.getByRole('region', { name: 'From the keepers of the realm' });
    await banner.getByText(TEXT).waitFor({ timeout: 10_000 });
    const fits = await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    const box = await banner.boundingBox();
    if (!fits || !box || box.x < 0 || box.x + box.width > 320) problems.push('The banner: it runs past a 320 px phone');
    // Kept beside the review sheets, as it is in no view of its own.
    await phone.screenshot({ path: join(ROOT, '.verify/shots/banner-320.png') });
    step = 'its cross puts it away for good';
    await banner.getByRole('button', { name: 'Put the banner away' }).click();
    await banner.waitFor({ state: 'detached', timeout: 5_000 });
    await phone.reload();
    await phone.locator('h1').first().waitFor();
    await phone.waitForTimeout(500);
    if (await banner.count()) problems.push('The banner: put away, it came back on reload');
    step = 'another player still sees it, until it is taken down';
    await wide.goto(served.url + '/');
    const theirs = wide.getByRole('region', { name: 'From the keepers of the realm' });
    await theirs.getByText(TEXT).waitFor({ timeout: 10_000 });
    await wide.screenshot({ path: join(ROOT, '.verify/shots/banner-1440.png') });
    await admin.screenshot({ path: join(ROOT, '.verify/shots/banner-console-1440.png') });
    await admin.getByRole('button', { name: 'Take it down' }).click();
    await theirs.waitFor({ state: 'detached', timeout: 10_000 });
  } catch (err) {
    problems.push(`The banner: ${step} failed (${say(err)})`);
  } finally {
    // Never left up for what comes after.
    await admin.evaluate(() => fetch('/api/admin/banner/down', { method: 'POST' })).catch(() => undefined);
    await Promise.all([admin.close(), phone.close(), wide.close()]);
  }
  return problems;
}
