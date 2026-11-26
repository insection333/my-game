// Part of step 6, in Chromium at 390 px: the plan of 26 November's third phase, played in the page (the audit
// of session 250), where its tests had held the rules alone.
// - Materials (session 247): the Citadel's switch is on; a building names what it takes of the lord's own
//   materials, a Level up takes them, and with the switch off the line goes and gold pays all.
// - The edict grows (session 248): the Citadel says how much the castle's levels lift it.
// - Charters (session 249): the keeper raises the Charter of Arms a rank in the Halls for war marks alone.
import type { Page } from 'playwright';
import { openPage, type Served } from './session.ts';

const say = (err: unknown) => (err instanceof Error ? err.message.split('\n')[0] : String(err));
const ready = (page: Page) =>
  page.waitForFunction(() => document.documentElement.dataset.ready === 'true', undefined, { timeout: 15_000 });
const held = (text: string | null) => Number(/([0-9,]+) held\./.exec(text ?? '')?.[1].replace(/,/g, '') ?? NaN);

async function materials(served: Served, problems: string[]) {
  const page = await openPage('chromium', '/castle/citadel', { viewport: { width: 390, height: 844 } }, 'elder');
  let step = 'the Citadel opens';
  try {
    await page.goto(served.url + '/castle/citadel');
    await ready(page);
    step = 'the switch is on';
    const box = page.getByLabel('Pay up to a quarter of each level in your materials');
    if (!(await box.isChecked())) throw new Error('the switch is off');
    step = 'the Spy Guild names the runes it takes';
    const row = page.locator('[data-slot="castle.buildings"] [data-ui="ActionRow"]', { hasText: 'Spy Guild' });
    const line = row.getByText(/^Also takes .+ ×[0-9,]+\. [0-9,]+ held\.$/);
    await line.waitFor({ timeout: 10_000 });
    const before = held(await line.textContent());
    step = 'a Level up takes them';
    await row.getByRole('button', { name: /^Level up \+1 for .+ and .+ ×[0-9,]+$/ }).click({ timeout: 5_000 });
    // Fewer held, or (all of them taken) none: "No Moon rune held: gold pays all."
    await page.waitForFunction(
      (was) => {
        const row = [...document.querySelectorAll('[data-slot="castle.buildings"] [data-ui="ActionRow"]')].find((r) =>
          /spy guild/i.test(r.textContent ?? ''),
        );
        const text = row?.textContent ?? '';
        const m = /([0-9,]+) held\./.exec(text);
        return / held: gold pays all\./.test(text) || (m !== null && Number(m[1].replace(/,/g, '')) < was);
      },
      before,
      { timeout: 10_000 },
    );
    step = 'the switch off, gold pays all';
    await box.uncheck();
    await line.waitFor({ state: 'detached', timeout: 5_000 });
    await row.getByText(/ held: gold pays all\.$/).waitFor({ state: 'detached', timeout: 5_000 });
    if (await row.getByRole('button', { name: /^Level up \+1 for .+ and / }).count())
      throw new Error('a Level up still names materials');
    await box.check();
    step = "the edict's growth is said";
    await page.getByText(/^\+\d+% from your castle$/).waitFor({ timeout: 5_000 });
  } catch (err) {
    problems.push(`Castle: the land's materials did not play in the page, where ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
}

async function charters(served: Served, problems: string[]) {
  const page = await openPage('chromium', '/castle/halls', { viewport: { width: 390, height: 844 } }, 'keeper');
  let step = 'the Halls open';
  try {
    await page.goto(served.url + '/castle/halls');
    await ready(page);
    step = 'the Charter of Arms is raised a rank';
    const row = page.locator('[data-slot="castle.charters"] [data-ui="ActionRow"]', { hasText: 'Charter of Arms' });
    await row.getByText('Rank 0 of 5').waitFor({ timeout: 10_000 });
    await row.getByRole('button', { name: 'Rank up +1 for 60 war marks' }).click({ timeout: 5_000 });
    await row.getByText('Rank 1 of 5').waitFor({ timeout: 10_000 });
    await row.getByText('+1% damage in every fight', { exact: true }).waitFor({ timeout: 5_000 });
  } catch (err) {
    problems.push(`Castle: a charter did not rise in the page, where ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
}

export async function runLandProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  await materials(served, problems);
  await charters(served, problems);
  return problems;
}
