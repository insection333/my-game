// Part of step 6, in Chromium at 390 px: the plan of 26 November's fourth phase, played in the page (the audit
// of session 252): a smith at 90 holding a boss's finds forges its heirloom from the gear sheet, the moment says
// so, and the heirloom is worn from the same sheet, its way said where it is worn.
import { XP_TABLE } from '@idle-clash/content';
import { endTour, playerWith, say } from './proofs-lanes.ts';
import type { Served } from './session.ts';

export async function runForgeProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  const page = await playerWith(served, 'Heir Smith', '/combat?panel=gear&slot=weapon', (s) => ({
    ...s,
    skills: Object.fromEntries(['smithing', 'melee', 'hitpoints'].map((k) => [k, { xp: XP_TABLE[90] }])),
    items: { 'dawnsteel-sword': 1, 'chieftains-torc': 12, 'crown-of-the-hill': 1 },
    features: {
      ...s.features,
      combat: { worn: { weapon: 'dawnsteel-sword' }, health: null, healthAt: 0, retreated: null },
    },
  }));
  let step = 'the sheet offers the forge';
  try {
    await endTour(page);
    await page.reload();
    const sheet = page.locator('[data-ui="Sheet"]');
    const row = sheet.locator('[data-ui="ActionRow"]', { hasText: "Troll-chief's blade" });
    await row.getByText("Chieftain's torc ×10 (12 held)", { exact: false }).waitFor({ timeout: 10_000 });
    step = 'Forge makes it, and says so';
    await row.getByRole('button', { name: 'Forge' }).click({ timeout: 5_000 });
    await page.getByText("Troll-chief's blade forged").first().waitFor({ timeout: 10_000 });
    step = 'it is worn from the sheet, its way said';
    const held = sheet.locator('[data-ui="ActionRow"]', { hasText: "Troll-chief's blade" });
    await held.getByRole('button', { name: 'Wear' }).click({ timeout: 10_000 });
    await held.getByText(/your blows land 20% harder/).waitFor({ timeout: 5_000 });
    await held.getByText('Worn', { exact: true }).waitFor({ timeout: 5_000 });
    step = 'no tempering is offered on it';
    if (await held.getByRole('button', { name: 'Temper' }).count()) throw new Error('it offers Temper');
  } catch (err) {
    problems.push(`An heirloom did not forge and wear in the page, where ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
  return problems;
}
