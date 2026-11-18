// Part of step 6, in Chromium: Castle Clash's way round (session 133, the owner: its navigation and
// layout were substandard), as the elder, two months in with a raised castle.
// - The five tabs are a bar of pictures that stays at the top of the page as it scrolls, and a tab
//   pressed from the foot of the long Army tab opens its own.
// - The castle's banner and its header are one card (beside each other on a wide screen), where they
//   stood as two cards one above the other on every tab.
// - A troop's Drill and Drill ×5 share a line on a phone, where they stood one under the other; a lord's
//   Plan shares the line of their Siege, where it stood alone on a line above it.
import type { Page } from 'playwright';
import { openPage, type Served } from './session.ts';

const say = (err: unknown) => (err instanceof Error ? err.message.split('\n')[0] : String(err));
const ready = (page: Page) =>
  page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, { timeout: 15_000 });

async function onAPhone(served: Served, problems: string[]) {
  const page = await openPage('chromium', '/castle/army', { viewport: { width: 390, height: 844 } }, 'elder');
  let step = 'the Army opens';
  try {
    await page.goto(served.url + '/castle/army');
    await ready(page);
    const nav = page.getByRole('navigation', { name: 'Castle Clash' });
    await nav.waitFor({ timeout: 10_000 });
    step = 'the tabs are pictures';
    const pictures = await nav.locator('a svg').count();
    if (pictures < 5) problems.push(`Castle: the tabs carry ${pictures} pictures, not one each`);
    step = 'the banner and the header are one card';
    const one = await page.evaluate(() => {
      const banner = document.querySelector('[data-slot="castle.banner"]')?.closest('[data-section]');
      const header = document.querySelector('[data-slot="castle.header"]')?.closest('[data-section]');
      return !!banner && banner === header;
    });
    if (!one) problems.push('Castle: the banner and the header stand as two cards');
    step = "a troop's drills share a line";
    const drills = await page.evaluate(() => {
      const row = document.querySelector('[data-slot="castle.units"] [data-ui="ActionRow"]');
      const [a, b] = Array.from(row?.querySelectorAll('button') ?? []).filter((x) =>
        /^Drill/.test(x.textContent ?? ''),
      );
      return a && b ? Math.abs(a.getBoundingClientRect().top - b.getBoundingClientRect().top) : -1;
    });
    if (drills < 0 || drills > 2)
      problems.push("Castle: a troop's Drill and Drill ×5 stand one under the other on a phone");
    step = 'the tabs stay at the top as the page scrolls';
    await page.evaluate(() => {
      const main = document.querySelector('main')!;
      main.scrollTop = main.scrollHeight;
    });
    await page.waitForTimeout(200);
    const held = await page.evaluate(() => {
      const main = document.querySelector('main')!.getBoundingClientRect();
      const bar = document.querySelector('[data-castle-nav]')!.getBoundingClientRect();
      return bar.top >= main.top - 1 && bar.bottom <= main.top + 120;
    });
    if (!held) problems.push('Castle: the tabs scroll away with the Army');
    step = 'a tab pressed from the foot opens its own';
    await nav.getByRole('link', { name: 'Citadel' }).click();
    await page.locator('[data-slot="castle.buildings"]').waitFor({ timeout: 10_000 });
  } catch (err) {
    problems.push(`Castle: failed where ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
}

async function onAWideScreen(served: Served, problems: string[]) {
  const page = await openPage('chromium', '/castle', { viewport: { width: 1440, height: 900 } }, 'elder');
  let step = 'the War opens';
  try {
    await page.goto(served.url + '/castle');
    await ready(page);
    step = 'the banner stands beside the header';
    const beside = await page.evaluate(() => {
      const a = document.querySelector('[data-slot="castle.banner"]')!.getBoundingClientRect();
      const b = document.querySelector('[data-slot="castle.header"]')!.getBoundingClientRect();
      return a.right <= b.left + 1 && Math.abs(a.top - b.top) < 2;
    });
    if (!beside) problems.push('Castle: on a wide screen the banner does not stand beside the header');
    step = "a lord's Plan shares its Siege's line";
    const lord = page.locator('[data-slot="castle.targets"] [data-ui="ActionRow"]').first();
    await lord.waitFor({ timeout: 10_000 });
    const plan = await lord.getByRole('button', { name: 'Plan' }).boundingBox();
    const siege = await lord.getByRole('button', { name: /^(Siege|Strike back|Scout)/ }).boundingBox();
    if (!plan || !siege || Math.abs(plan.y + plan.height / 2 - (siege.y + siege.height / 2)) > 4)
      problems.push("Castle: a lord's Plan stands on a line apart from its Siege");
  } catch (err) {
    problems.push(`Castle: failed where ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
}

export async function runCastleProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  await onAPhone(served, problems);
  await onAWideScreen(served, problems);
  return problems;
}
