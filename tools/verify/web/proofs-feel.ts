// Part of step 6, in Chromium: the game's feel, in the page itself.
// - A screen reader hears what things are: a resting lane as resting, Start within its action's row.
// - Work is seen landing: a newcomer's chop fills its lane's bar smoothly (one running animation),
//   and the logs and XP it brings rise in the gains feed.
// - The keyboard holds: in Settings over a working lane, the focus stays where the player put it as
//   the page ticks, Tab stays inside the sheet, the page behind it sleeps (inert), and Escape closes it
//   and wakes the page.
// - Losing the server is said, and recovering from it too: with the network gone, a change that
//   cannot get through makes the page say it is reconnecting (after a few seconds, so a blip never
//   shows); with the network back, the line goes.
// - A goal pays in a supply cache, opened in a moment that says what it held.
// - A big sale asks first: "Sell all but 1" says what it comes to and waits; "Keep them" keeps them
//   and hands the focus back; selling says what it brought in, where the focus now is.
import type { Page } from 'playwright';
import { playerWith, say } from './proofs-lanes.ts';
import type { Served } from './session.ts';

async function workLands(page: Page, problems: string[]) {
  let step = 'the newcomer opens Woodcutting';
  try {
    await page.goto(page.url().replace(/\/[^/]*$/, '/skills/woodcutting'));
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
    step = 'a screen reader hears what each button is for';
    // A resting lane's chip is heard as resting (not its own name twice), and Start inside its row.
    if (!(await page.getByRole('button', { name: 'Gathering: Resting' }).count()))
      problems.push('Screen reader: a resting lane is not heard as resting');
    step = 'the newcomer starts chopping, by the row it is in';
    await page.getByRole('group', { name: 'Pine tree' }).getByRole('button', { name: 'Start' }).click();
    step = "the lane's bar runs on its own";
    await page.waitForTimeout(1500);
    const running = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-slot="shell.lane"] *')).some((el) =>
        el
          .getAnimations()
          .some((a) => a.playState === 'running' && (a as CSSAnimation).animationName.includes('fill-up')),
      ),
    );
    if (!running) problems.push("Feel: a working lane's bar is not filling by itself");
    step = 'the chop lands in the gains feed';
    await page.locator('[data-shell="gains"]', { hasText: '+1 Pine logs' }).waitFor({ timeout: 15_000 });
    await page.locator('[data-shell="gains"]', { hasText: 'Woodcutting XP' }).waitFor({ timeout: 2_000 });
  } catch (err) {
    problems.push(`Feel: failed where ${step} (${say(err)})`);
  }
}

async function keyboardHolds(page: Page, problems: string[]) {
  let step = 'Settings opens over a working lane';
  try {
    await page.goto(page.url().replace(/\/[^/?]*(\?.*)?$/, '/?panel=settings'));
    const sheet = page.locator('[data-ui="Sheet"]');
    await sheet.waitFor({ timeout: 10_000 });
    step = 'the focus stays where the player put it while the page ticks';
    await page.getByLabel('Light').focus();
    await page.waitForTimeout(2500);
    if (!(await page.getByLabel('Light').evaluate((el) => el === document.activeElement)))
      problems.push('Keyboard: the page drawing again moved the focus out of Settings');
    step = 'Tab stays inside the sheet';
    for (let i = 0; i < 30; i++) await page.keyboard.press('Tab');
    if (!(await sheet.evaluate((el) => el.contains(document.activeElement))))
      problems.push('Keyboard: Tab left the Settings sheet for the page behind it');
    step = 'the page behind it sleeps';
    if (!(await page.evaluate(() => !!document.querySelector('[data-main]')?.closest('[inert]'))))
      problems.push('Keyboard: the page behind the Settings sheet can still be reached');
    step = 'Escape closes it';
    await page.keyboard.press('Escape');
    await sheet.waitFor({ state: 'detached', timeout: 5_000 });
    if (await page.evaluate(() => !!document.querySelector('[inert]')))
      problems.push('Keyboard: the page stays asleep after its sheet closed');
  } catch (err) {
    problems.push(`Keyboard: failed where ${step} (${say(err)})`);
  }
}

async function connectionSaid(page: Page, problems: string[]) {
  let step = 'the network goes';
  const status = page.locator('[data-shell="connection"]');
  try {
    await page.context().setOffline(true);
    // A change the player makes cannot get through: stoking the fire, now.
    await page.locator('[data-ui="FireBadge"]').click();
    await page.waitForTimeout(1500);
    if (await status.isVisible()) problems.push('Connection: a blip of a second and a half already shows the line');
    step = 'the page says it is reconnecting';
    await status.waitFor({ timeout: 15_000 });
    step = 'the network comes back and the line goes';
    await page.context().setOffline(false);
    await status.waitFor({ state: 'detached', timeout: 20_000 });
  } catch (err) {
    problems.push(`Connection: failed where ${step} (${say(err)})`);
  } finally {
    await page.context().setOffline(false);
  }
}

async function sellingAsks(served: Served, problems: string[]) {
  let step = 'a player with 50 pine logs opens their panel';
  const page = await playerWith(served, 'Sells With Care', '/storehouse?panel=item&item=pine-logs', (s) => ({
    ...s,
    items: { ...s.items, 'pine-logs': 50 },
  }));
  // The focus moves on the next frame, so it is given a moment to arrive.
  const focused = (name: string) =>
    page
      .waitForFunction((n) => document.activeElement?.textContent?.trim() === n, name, { timeout: 2_000 })
      .then(
        () => true,
        () => false,
      );
  try {
    await page.evaluate(() => localStorage.setItem('tourDone', '1'));
    await page.reload();
    const sheet = page.locator('[data-ui="Sheet"]');
    step = '"Sell all but 1" asks first, with what the sale comes to';
    await sheet.getByRole('button', { name: 'Sell all but 1' }).click({ timeout: 10_000 });
    await sheet.getByText('Sell 49 for 49 gold?').waitFor({ timeout: 3_000 });
    if (!(await focused('Sell'))) problems.push('Selling: the question does not take the focus to its answer');
    step = '"Keep them" keeps them';
    await sheet.getByRole('button', { name: 'Keep them' }).click();
    await sheet.getByText('You have 50').waitFor({ timeout: 3_000 });
    if (!(await focused('Sell all but 1'))) problems.push('Selling: "Keep them" loses the focus');
    step = 'selling says what it brought in';
    await sheet.getByRole('button', { name: 'Sell all but 1' }).click();
    await sheet.getByRole('button', { name: 'Sell', exact: true }).click();
    await sheet.getByRole('status').filter({ hasText: 'Sold 49 for 49 gold' }).waitFor({ timeout: 3_000 });
    await sheet.getByText('You have 1').waitFor({ timeout: 3_000 });
    if (!(await focused('Sold 49 for 49 gold'))) problems.push('Selling: after a sale the focus is lost');
  } catch (err) {
    problems.push(`Selling: failed where ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
}

async function cacheOpens(served: Served, problems: string[]) {
  let step = 'a player with a short goal done opens the Hearth';
  const page = await playerWith(served, 'Opens Caches', '/', (s) => ({
    ...s,
    mastery: { ...s.mastery, 'woodcutting:pine-tree': 12 },
    features: {
      ...s.features,
      goals: {
        claimed: [
          'chop-a-pine',
          'mine-copper-ore',
          'smelt-a-copper-bar',
          'forge-a-copper-sword',
          'wear-your-sword',
          'defeat-a-hollow-rat',
        ],
        short: [
          {
            id: 'short-0',
            kind: 'count',
            action: { feature: 'woodcutting', id: 'pine-tree' },
            skill: 'woodcutting',
            lane: 'gathering',
            target: 10,
            base: 0,
            reward: 400,
          },
        ],
        made: 1,
        daily: null,
        milestones: [],
        opened: 0,
      },
    },
  }));
  try {
    await page.evaluate(() => localStorage.setItem('tourDone', '1'));
    await page.reload();
    step = 'the goal offers its cache';
    await page
      .locator('[data-slot="hearth.goals"]', { hasText: 'A cache, about 400 gold' })
      .waitFor({ timeout: 10_000 });
    step = 'opening it shows what it held';
    await page.getByRole('button', { name: 'Open cache' }).click();
    const moment = page.locator('[data-ui="Moment"]', { hasText: /cache: [\d,]+ gold/ });
    // As long as the goal itself was given: a runner busy with three browsers can take seconds.
    await moment.waitFor({ timeout: 10_000 });
    if (!(await moment.locator('[data-icon="supply-cache"]').count()))
      problems.push('Caches: the moment does not show the cache');
  } catch (err) {
    problems.push(`Caches: failed where ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
}

export async function runFeelProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  const page = await playerWith(served, 'Feels Right', '/', (s) => s);
  await page.evaluate(() => localStorage.setItem('tourDone', '1'));
  try {
    await workLands(page, problems);
    await keyboardHolds(page, problems);
    await connectionSaid(page, problems);
  } finally {
    await page.close();
  }
  await sellingAsks(served, problems);
  await cacheOpens(served, problems);
  return problems;
}
