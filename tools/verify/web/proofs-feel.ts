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
// - On a phone the menu at the foot holds five places, and Hiscores is in the account menu behind the
//   picture at the top right (session 130, the owner): it opens as a small popup with a cross, Escape
//   closes it and hands the focus back, the focus tabbing out of it closes it (session 132), and its
//   Hiscores leads to the ladders. The wide rail keeps it.
// - On wide screens the game sits in its frame (session 131): the header and the rail in the lodge's
//   night in the light theme too, the crest at the rail's head and who is playing at its foot, the page
//   held in gold leaf on the rail; a phone keeps its own header, with neither; a phone on its side (844 by
//   390) reaches every place on its rail (session 132).
import type { Page } from 'playwright';
import { endTour, playerWith, say } from './proofs-lanes.ts';
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

export async function accountMenu(page: Page, problems: string[]) {
  let step = 'the Hearth opens on a phone';
  try {
    await page.goto(page.url().replace(/\/[^/?]*(\?.*)?$/, '/'));
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
    step = 'the menu at the foot leaves Hiscores out';
    if (await page.locator('[data-menu] a[href="/hiscores"]').isVisible())
      problems.push('Account menu: Hiscores is still in the menu at the foot on a phone');
    step = 'the account button opens its menu';
    const button = page.getByRole('button', { name: 'Your account' });
    await button.click();
    const menu = page.getByRole('dialog', { name: 'Your account' });
    await menu.waitFor({ timeout: 5_000 });
    for (const name of ['Hiscores', 'Deeds', 'Your profile', 'Settings'])
      if (!(await menu.getByRole('link', { name }).isVisible())) problems.push(`Account menu: no ${name}`);
    step = 'Escape closes it and hands the focus back';
    await page.keyboard.press('Escape');
    await menu.waitFor({ state: 'hidden', timeout: 2_000 });
    if (!(await button.evaluate((el) => el === document.activeElement)))
      problems.push('Account menu: closing it does not hand the focus back to its button');
    step = 'tabbing past its last place closes it';
    await button.click();
    await menu.waitFor({ timeout: 5_000 });
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
    if (await menu.isVisible()) problems.push('Account menu: still open once the focus has left it');
    step = 'its Hiscores leads to the ladders';
    await button.click();
    await menu.getByRole('link', { name: 'Hiscores' }).click();
    await page.locator('[data-slot="hiscores.ladder"]').waitFor({ timeout: 10_000 });
    if (await menu.isVisible()) problems.push('Account menu: still open on the page it led to');
    step = 'the wide rail keeps Hiscores';
    await page.setViewportSize({ width: 1440, height: 900 });
    if (!(await page.locator('[data-menu] a[href="/hiscores"]').isVisible()))
      problems.push('Account menu: the wide rail lost Hiscores');
  } catch (err) {
    problems.push(`Account menu: failed where ${step} (${say(err)})`);
  } finally {
    await page.setViewportSize({ width: 390, height: 844 });
  }
}

/** How light a colour is, 0 to 1. */
const lightness = (rgb: string) => {
  const [r, g, b] = (rgb.match(/[\d.]+/g) ?? ['0', '0', '0']).map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

export async function frameDrawn(page: Page, problems: string[]) {
  let step = 'the Hearth opens wide';
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(page.url().replace(/\/[^/?]*(\?.*)?$/, '/'));
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
    step = 'the frame is drawn in the night';
    const look = () =>
      page.evaluate(() => {
        const header = document.querySelector('header')!;
        const rail = document.querySelector('[data-menu]')!;
        const here = rail.querySelector('[aria-current="page"]');
        const crest = document.querySelector('[data-crest]');
        const foot = document.querySelector('[data-rail-foot]');
        const seen = (el: Element | null) => !!el && el.getBoundingClientRect().width > 0;
        return {
          header: getComputedStyle(header).backgroundImage,
          headerInk: getComputedStyle(header).color,
          rail: getComputedStyle(rail).backgroundImage,
          here: here ? getComputedStyle(here).boxShadow : '',
          crest: seen(crest),
          foot: seen(foot),
        };
      });
    const wide = await look();
    if (!wide.header.includes('gradient') || !wide.rail.includes('gradient'))
      problems.push('Frame: the header and the rail are not drawn in the night on a wide screen');
    if (lightness(wide.headerInk) < 0.7) problems.push("Frame: the header's words are not light on its night");
    if (!wide.here.includes('inset')) problems.push('Frame: the page you are on is not marked on the rail');
    if (!wide.crest || !wide.foot) problems.push("Frame: the rail's crest or its foot is missing");
    step = 'a phone on its side reaches every place on the rail';
    await page.setViewportSize({ width: 844, height: 390 });
    const foot = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('[data-menu] a'));
      return Math.max(...links.map((a) => a.getBoundingClientRect().bottom)) - innerHeight;
    });
    if (foot > 1)
      problems.push(`Frame: on a phone on its side the rail's last place is ${Math.round(foot)} px below the screen`);
    step = 'a phone keeps its own header';
    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await look();
    if (narrow.header !== 'none' || narrow.crest || narrow.foot)
      problems.push("Frame: a phone's header took the wide frame");
  } catch (err) {
    problems.push(`Frame: failed where ${step} (${say(err)})`);
  } finally {
    await page.setViewportSize({ width: 390, height: 844 });
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
    await endTour(page);
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
    await endTour(page);
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
  await endTour(page);
  try {
    await workLands(page, problems);
    await keyboardHolds(page, problems);
    await accountMenu(page, problems);
    await frameDrawn(page, problems);
    await connectionSaid(page, problems);
  } finally {
    await page.close();
  }
  await sellingAsks(served, problems);
  await cacheOpens(served, problems);
  return problems;
}
