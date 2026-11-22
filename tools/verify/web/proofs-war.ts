// Part of step 6, in Chromium: Castle Clash's tabs on a wide screen leave no column ending early beside
// another (session 170, the owner: on the War, Today's strongholds stood in the bottom left of a desktop
// while its right was empty). On every tab, as a lord five days, two months and a year in, a section
// narrower than the page has a neighbour beside it for all but 240 px of its height. And the War's foes
// are cards, each with its odds, and those whose garrison is known drawn as a host.
import type { Page } from 'playwright';
import { openPage, type Served } from './session.ts';

const say = (err: unknown) => (err instanceof Error ? err.message.split('\n')[0] : String(err));
const ready = (page: Page) =>
  page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, { timeout: 15_000 });

const TABS = ['', '/army', '/citadel', '/halls', '/reports'];
const ALONE = 240;

/** Sections narrower than the page standing beside empty page for more than ALONE px. */
function lonely(page: Page) {
  return page.evaluate((alone) => {
    const main = document.querySelector('[data-main]')!.getBoundingClientRect();
    const secs = Array.from(document.querySelectorAll('[data-main] [data-section]'))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.height > 0);
    const widest = Math.max(...secs.map(({ r }) => r.width));
    const found: string[] = [];
    for (const a of secs) {
      if (a.r.width > widest * 0.7) continue;
      // The height of A beside which some section stands, over or under it at its side.
      const beside = secs
        .filter((b) => b !== a && (b.r.left >= a.r.right - 1 || b.r.right <= a.r.left + 1))
        .map((b) => [Math.max(a.r.top, b.r.top), Math.min(a.r.bottom, b.r.bottom)] as const)
        .filter(([t, b]) => b > t)
        .sort((x, y) => x[0] - y[0]);
      let covered = 0;
      let reach = a.r.top;
      for (const [t, b] of beside) {
        covered += Math.max(0, b - Math.max(t, reach));
        reach = Math.max(reach, b);
      }
      const empty = Math.round(a.r.height - covered);
      if (empty > alone && main.width > 0) {
        const title = a.el.querySelector('h2, h3')?.textContent?.trim() ?? a.el.tagName;
        found.push(`"${title}" stands beside ${empty} px of empty page`);
      }
    }
    return found;
  }, ALONE);
}

export async function runWarProofs(served: Served, problems: string[]) {
  for (const as of ['squire', 'elder', 'keeper'] as const) {
    const page = await openPage('chromium', '/castle', { viewport: { width: 1440, height: 900 } }, as);
    let step = 'opening the War';
    try {
      for (const tab of TABS) {
        step = `the ${tab || '/war'} tab`;
        await page.goto(served.url + '/castle' + tab);
        await ready(page);
        if (!tab) await page.locator('[data-slot="castle.strongholds"]').waitFor({ timeout: 15_000 });
        for (const p of await lonely(page)) problems.push(`War layout (${as}, ${tab || '/war'}): ${p}`);
        if (tab) continue;
        step = "the War's foe cards";
        const cards = page.locator('[data-slot="castle.strongholds"] [data-foe]');
        if ((await cards.count()) !== 5) problems.push(`War layout (${as}): ${await cards.count()} stronghold cards`);
        const standing = cards.filter({ hasText: /to win/ });
        const drawn = standing.filter({ has: page.locator('[data-slot="castle.garrison"]') });
        if ((await standing.count()) !== (await drawn.count()))
          problems.push(`War layout (${as}): a stronghold standing does not draw its host`);
      }
    } catch (err) {
      problems.push(`War layout (${as}): failed at ${step} (${say(err)})`);
    } finally {
      await page.close();
    }
  }
}
