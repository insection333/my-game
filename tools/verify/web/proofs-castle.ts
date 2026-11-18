// Part of step 6, in Chromium: Castle Clash's way round (session 133, the owner: its navigation and
// layout were substandard), as the elder, two months in with a raised castle.
// - The five tabs are a bar of pictures that stays at the top of the page as it scrolls, and a tab
//   pressed from the foot of the long Army tab opens its own.
// - The castle's banner and its header are one card (beside each other on a wide screen), where they
//   stood as two cards one above the other on every tab.
// - A troop's Train +1 and +5 share a line on a phone (Drill and Drill ×5 stood one under the other), and
//   its Level up offers +1 and +5 (session 134, the owner); a lord's Plan shares the line of their Siege,
//   where it stood alone on a line above it.
// - Gold moves to and from the treasury by an amount typed or a slider's share, each moving the other
//   (session 135): half the treasury typed stands the slider at the middle, the slider at 10% writes a
//   tenth, Withdraw says what arrives and what is lost on the way before the press, and the press moves
//   that.
// - Each stronghold standing says what holds it (its strongest troops and its trap) beside its chance, and
//   all cost alike to besiege (session 136: the easiest cost more than the four harder ones).
// - The wounded are healed by as much as the slider picks, at that much's price (session 134): 5% picked
//   takes 5 points off the wounds, not all of them.
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
    step = "a troop's training shares a line";
    const train = await page.evaluate(() => {
      const row = document.querySelector('[data-slot="castle.units"] [data-ui="ActionRow"]');
      const [a, b] = Array.from(row?.querySelectorAll('button') ?? []).filter((x) =>
        /^Train \+/.test(x.getAttribute('aria-label') ?? ''),
      );
      return a && b ? Math.abs(a.getBoundingClientRect().top - b.getBoundingClientRect().top) : -1;
    });
    if (train < 0 || train > 2) problems.push("Castle: a troop's Train +1 and +5 do not share a line on a phone");
    step = 'a troop levels up by one or five';
    const units = page.locator('[data-slot="castle.units"]');
    for (const more of [1, 5])
      if (!(await units.getByRole('button', { name: new RegExp(`^Level up \\+${more} for`) }).count()))
        problems.push(`Castle: no troop offers Level up +${more}`);
    step = 'the slider heals by the part picked';
    const wounded = () =>
      page.evaluate(() => {
        const m = /(\d+)% of your troops wounded/.exec(document.querySelector('main')!.textContent ?? '');
        return m ? Number(m[1]) : null;
      });
    const before = await wounded();
    if (before === null || before < 7)
      problems.push(`Castle: the elder's troops are not wounded enough to heal a part (${before})`);
    else {
      await page.getByLabel(/^Heal by/).fill('5');
      const heal = page.getByRole('button', { name: /^Heal 5% for/ });
      await heal.click();
      await page.waitForFunction(
        (was) =>
          !new RegExp(`\\b${was}% of your troops wounded`).test(document.querySelector('main')!.textContent ?? ''),
        before,
        { timeout: 10_000 },
      );
      const after = await wounded();
      if (after === null || after < before - 6 || after > before - 4)
        problems.push(`Castle: healing 5% took the wounds from ${before}% to ${after ?? 'none'}%`);
    }
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
    step = 'a share of the treasury is withdrawn as the page says';
    const read = () =>
      page.evaluate(async () => {
        const c = (await (await fetch('/api/castle')).json()) as { castle: { treasury: number } };
        const g = (await (await fetch('/api/game')).json()) as { state: { items: Record<string, number> } };
        return { treasury: c.castle.treasury, gold: g.state.items.gold ?? 0 };
      });
    const was = await read();
    // The treasury's section: the treasury and Move gold, its own panel since session 139.
    const treasury = page.locator('section').filter({ has: page.locator('[data-slot="castle.treasury"]') });
    await treasury.getByRole('button', { name: 'Withdraw', exact: true }).click();
    // Typing an amount moves the slider: half the treasury stands it at the middle.
    await treasury.getByLabel('Gold', { exact: true }).fill(String(Math.floor(was.treasury / 2)));
    const middle = Number(await treasury.getByLabel(/of the treasury/).inputValue());
    if (Math.abs(middle - 50) > 1) problems.push(`Castle: half the treasury typed stood the slider at ${middle}`);
    // And the slider writes the amount.
    await treasury.getByLabel(/of the treasury/).fill('10');
    const written = Number((await treasury.getByLabel('Gold', { exact: true }).inputValue()).replace(/\D/g, ''));
    if (Math.abs(written - was.treasury * 0.1) > was.treasury * 0.01)
      problems.push(`Castle: the slider at 10% wrote ${written} for a treasury of ${was.treasury}`);
    const moved = Math.floor(was.treasury * 0.1);
    const lost = Math.ceil(moved * 0.2);
    const said = await treasury.textContent();
    if (!said?.includes('lost on the way'))
      problems.push('Castle: Withdraw does not say what is lost before the press');
    await treasury.getByRole('button', { name: /^Withdraw \d/ }).click();
    await page.waitForFunction(
      async (t) =>
        ((await (await fetch('/api/castle')).json()) as { castle: { treasury: number } }).castle.treasury !== t,
      was.treasury,
      { timeout: 10_000 },
    );
    const now = await read();
    // The treasury's upkeep and the elder's running lanes move gold by a little meanwhile: within 1%.
    const took = was.treasury - now.treasury;
    const paid = now.gold - was.gold;
    const near = (a: number, b: number) => Math.abs(a - b) <= moved * 0.01;
    if (!near(took, moved) || !near(paid, moved - lost))
      problems.push(
        `Castle: withdrawing 10% of ${was.treasury} took ${took} and paid ${paid} (expected ${moved} and ${moved - lost})`,
      );
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
    step = 'each stronghold standing says what holds it, and all cost alike';
    // The strongholds come with the day's targets, after the castle: wait for one standing (on GitHub's
    // slower machines they were read before they arrived).
    const strongholds = page.locator('[data-slot="castle.strongholds"] [data-ui="ActionRow"]');
    await strongholds
      .filter({ hasText: /to win|Beyond you/ })
      .first()
      .waitFor({ timeout: 15_000 });
    const rows = await strongholds.allInnerTexts();
    const standing = rows.filter((r) => /to win|Beyond you/.test(r));
    if (!standing.length || standing.some((r) => !r.includes('at the gate')))
      problems.push('Castle: a stronghold does not say what holds it beside its chance');
    const fees = new Set(standing.map((r) => /Siege for ([^\n]+)/.exec(r)?.[1]));
    if (fees.size !== 1)
      problems.push(`Castle: the day's strongholds cost differently to besiege (${[...fees].join(', ')})`);
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
