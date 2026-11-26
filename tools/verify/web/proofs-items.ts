// Part of step 6, in Chromium at 390 px: the plan of 26 November's second phase, played in the page (the audit
// of session 246), where its tests had held the rules alone.
// - The steading's later stages (session 244): a work at its pennant asks Uncommon finds on its sheet, is
//   raised with them, and its raising is said as the sixth of ten.
// - Feasts (session 245): Cooking's feast row says what it lifts, and with a stew's feast carried the fighter's
//   XP line names it.
import { XP_TABLE } from '@idle-clash/content';
import type { Page } from 'playwright';
import { endTour, playerWith, say } from './proofs-lanes.ts';
import type { Served } from './session.ts';

const skills = (levels: Record<string, number>) =>
  Object.fromEntries(Object.entries(levels).map(([k, l]) => [k, { xp: XP_TABLE[l] }]));

async function tryOn(
  page: Page,
  problems: string[],
  what: string,
  steps: (mark: (s: string) => void) => Promise<void>,
) {
  let step = 'the page opens';
  try {
    await endTour(page);
    await page.reload();
    await steps((s) => (step = s));
  } catch (err) {
    problems.push(`${what}: failed where ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
}

async function laterStages(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Late Builder', '/?panel=work&work=woodyard', (s) => ({
    ...s,
    items: { gold: 5_000_000, 'ancient-logs': 4_000, 'birds-nest': 60, 'rough-garnet': 60 },
    features: { ...s.features, steading: { stages: { woodyard: 5 } } },
  }));
  await tryOn(page, problems, "The steading's later stages", async (mark) => {
    const sheet = page.locator('[data-ui="Sheet"]');
    mark('the sheet asks the finds');
    await sheet.getByText("Bird's nest ×60").waitFor({ timeout: 10_000 });
    await sheet.getByText('Rough garnet ×60').waitFor({ timeout: 5_000 });
    mark('it is raised with them, the sixth of ten');
    await sheet.getByRole('button', { name: 'Raise', exact: true }).click({ timeout: 5_000 });
    await page.getByText('Woodyard raised: 6 of 10').first().waitFor({ timeout: 5_000 });
    mark('the next asks more of them');
    await sheet.getByText("Bird's nest ×90").waitFor({ timeout: 5_000 });
  });
}

async function feasts(served: Served, problems: string[]) {
  const cook = await playerWith(served, 'Feast Cook', '/skills/cooking', (s) => ({
    ...s,
    skills: skills({ cooking: 90 }),
  }));
  await tryOn(cook, problems, "Cooking's feasts", async (mark) => {
    mark('the feast row says what it lifts');
    await cook
      .getByText(/Each heals [0-9,]+ and lifts combat XP 5% while eaten first/)
      .first()
      .waitFor({ timeout: 10_000 });
  });
  const fighter = await playerWith(served, 'Feast Eater', '/combat', (s) => ({
    ...s,
    skills: skills({ melee: 90, hitpoints: 90 }),
    items: { 'dawnsteel-sword': 1, 'sturgeon-feast': 20, 'sturgeon-stew': 40 },
    features: {
      ...s.features,
      combat: { worn: { weapon: 'dawnsteel-sword' }, health: null, healthAt: 0, retreated: null },
    },
  }));
  await tryOn(fighter, problems, "A stew's feast in the loadout", async (mark) => {
    mark("the loadout's XP line names the feast");
    await fighter
      .getByText(/XP \+5%: Sturgeon feast \+5%/)
      .first()
      .waitFor({ timeout: 10_000 });
  });
}

export async function runItemProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  await laterStages(served, problems);
  await feasts(served, problems);
  return problems;
}
