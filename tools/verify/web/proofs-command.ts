// Part of step 6, in Chromium: Castle Clash in command (sessions 167 and 168, the owner: make the player
// feel they command armies and run spies), as the squire, a week in, on a 320 px phone.
// - A stronghold's Send spies opens its sheet with three missions, each with its picture, before the
//   siege; the plan draws the two hosts as they will meet.
// - The fortress's Send spies opens the fortress's own sheet with its missions.
// - A siege pressed is played out on its row: the two hosts, nine figures a side, inside the row, the
//   beaten one marked.
// - The Army draws each formation as a host of nine figures.
import type { Page } from 'playwright';
import { openPage, type Served } from './session.ts';

const say = (err: unknown) => (err instanceof Error ? err.message.split('\n')[0] : String(err));
const ready = (page: Page) =>
  page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, { timeout: 15_000 });

/** Figures in a host, by side, and whether every figure stands inside the field. */
async function hosts(page: Page, at: string) {
  return page.locator(at).evaluate((field) => {
    const box = field.getBoundingClientRect();
    const count = (side: string) => field.querySelectorAll(`[data-side="${side}"] [class*="figure"]`).length;
    const inside = [...field.querySelectorAll('[class*="figure"]')].every((f) => {
      const r = f.getBoundingClientRect();
      return r.left >= box.left - 1 && r.right <= box.right + 1;
    });
    return { you: count('you'), foe: count('foe'), inside, won: (field as HTMLElement).dataset.won ?? null };
  });
}

export async function runCommandProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  const page = await openPage('chromium', '/castle', { viewport: { width: 320, height: 720 } }, 'squire');
  let step = 'opening the War';
  try {
    await page.goto(served.url + '/castle');
    await ready(page);
    step = "a stronghold's Send spies";
    const rows = page.locator('[data-slot="castle.strongholds"] [data-foe]');
    // The first stronghold standing, held by its name, as its row loses its Siege once it falls.
    const name = await rows
      .filter({ has: page.getByRole('button', { name: /^Siege/ }) })
      .first()
      .locator('strong, h3, [class*="name"]')
      .first()
      .innerText();
    const standing = rows.filter({ hasText: name }).first();
    await standing.getByRole('button', { name: 'Send spies' }).click();
    const sheet = page.locator('[data-slot="castle.target"]');
    await sheet.waitFor();
    const missions = sheet.locator('[data-slot="castle.foeMissions"] [data-ui="ActionRow"]');
    if ((await missions.count()) !== 3)
      problems.push(`Command: a stronghold's sheet offers ${await missions.count()} missions, not 3`);
    if ((await missions.locator('svg').count()) < 3) problems.push("Command: a stronghold's missions are not pictured");
    const spiesAt = (await sheet.locator('[data-slot="castle.foeMissions"]').boundingBox())?.y ?? Infinity;
    const siegeAt = (await sheet.getByRole('button', { name: /^Siege/ }).boundingBox())?.y ?? -Infinity;
    if (spiesAt > siegeAt) problems.push("Command: a stronghold's spies stand under its siege");
    const plan = await hosts(page, '[data-slot="castle.plan"] [data-slot="castle.battlefield"]');
    if (plan.you !== 9 || plan.foe !== 9)
      problems.push(`Command: the plan draws ${plan.you} and ${plan.foe} figures, not 9 a side`);
    await sheet.getByRole('button', { name: /^Close/ }).click();
    step = "the fortress's Send spies";
    await page.locator('[data-slot="castle.incursion"]').getByRole('button', { name: 'Send spies' }).click();
    await sheet.waitFor();
    if ((await sheet.locator('[data-slot="castle.foeMissions"] [data-ui="ActionRow"]').count()) !== 3)
      problems.push("Command: the fortress's sheet does not offer its three missions");
    await sheet.getByRole('button', { name: /^Close/ }).click();
    step = 'a siege played out';
    await standing.getByRole('button', { name: /^Siege/ }).click();
    const field = standing.locator('[data-slot="castle.battlefield"]');
    await field.waitFor({ timeout: 10_000 });
    const fought = await hosts(page, '[data-slot="castle.strongholds"] [data-slot="castle.battlefield"]');
    if (fought.you !== 9 || fought.foe !== 9)
      problems.push(`Command: a siege's battle draws ${fought.you} and ${fought.foe} figures, not 9 a side`);
    if (!fought.inside) problems.push("Command: a siege's battle draws figures past its field at 320 px");
    if (fought.won === null) problems.push("Command: a siege's battle does not mark who carried the day");
    step = "the Army's formations";
    await page.goto(served.url + '/castle/army');
    await ready(page);
    const line = await hosts(page, '[data-slot="castle.offense"] [data-slot="castle.battleLine"]');
    if (line.you !== 9) problems.push(`Command: the attack formation draws ${line.you} figures, not 9`);
  } catch (err) {
    problems.push(`Command: failed at ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
  return problems;
}
