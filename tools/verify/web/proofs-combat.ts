// Part of step 6, in Chromium: session 8's proofs in the page itself.
// - Gear is worn from the Combat page, and Your odds then rates the hollow rat: Fair for a newcomer
//   with First steps' ten loaves.
// - A retreat costs nothing: a fighter who took on a hill troll with two loaves an hour ago comes back
//   to the lane stopped with the reason, the sword and helm still worn, and nothing else gone.
import { XP_TABLE } from '@idle-clash/content';
import { HOUR, type State } from '@idle-clash/kernel';
import { playerWith, run, say } from './proofs-lanes.ts';
import type { Served } from './session.ts';

const skills = (levels: Record<string, number>) =>
  Object.fromEntries(Object.entries(levels).map(([k, l]) => [k, { xp: XP_TABLE[l] }]));

async function wearFromThePage(served: Served, problems: string[]) {
  const page = await playerWith(served, 'New Fighter', '/combat', (s) => ({
    ...s,
    items: { 'copper-sword': 1, bread: 10 },
  }));
  let step = 'the hollow rat asks for a weapon';
  try {
    const rat = page.locator('[data-slot="combat.foes"] [data-ui="ActionRow"]', { hasText: 'Hollow rat' });
    await rat.getByText('Wear a weapon first').waitFor({ timeout: 10_000 });
    step = 'the weapon slot opens the sword';
    await page.locator('[data-ui="WeaponSlot"]').click();
    const choice = page.locator('[role="dialog"] [data-ui="ActionRow"]', { hasText: 'Copper sword' });
    await choice.getByRole('button', { name: 'Wear' }).click();
    step = 'the sword is shown worn';
    await choice.getByText('Worn').waitFor({ timeout: 5_000 });
    await page.keyboard.press('Escape');
    await page.locator('[data-ui="WeaponSlot"]', { hasText: 'Copper sword' }).waitFor({ timeout: 5_000 });
    step = 'Your odds rates the hollow rat Fair';
    await rat.getByText('Fair').waitFor({ timeout: 5_000 });
    await rat.getByRole('button', { name: 'Fight' }).waitFor({ timeout: 5_000 });
  } catch (err) {
    problems.push(`Gear: wearing a sword from the Combat page failed where ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
}

async function retreatCostsNothing(served: Served, problems: string[]) {
  const items = { 'copper-sword': 1, 'copper-helm': 1, bread: 2, gold: 40, 'pine-logs': 7 };
  const page = await playerWith(served, 'Brave Fighter', '/combat', (s, now) => {
    const then = now - HOUR;
    const before: State = {
      ...s,
      clock: then,
      lastSeen: then,
      fireUntil: then,
      luck: { misses: 0, lastMoment: then },
      skills: skills({ melee: 5, hitpoints: 27 }),
      items,
      features: {
        ...s.features,
        combat: {
          worn: { weapon: 'copper-sword', helm: 'copper-helm' },
          health: null,
          healthAt: then,
          retreated: null,
        },
      },
    };
    return run(served, before, then, [
      { type: 'start', lane: 'combat', action: { feature: 'combat', id: 'hill-troll' } },
    ]);
  });
  try {
    await page
      .locator('[data-slot="shell.lane"]')
      .getByText('Retreated from the hill troll: out of food')
      .first()
      .waitFor({ timeout: 15_000 });
    await page.locator('[data-ui="WeaponSlot"]', { hasText: 'Copper sword' }).waitFor({ timeout: 5_000 });
    await page.locator('[data-ui="GearSlot"]', { hasText: 'Copper helm' }).waitFor({ timeout: 5_000 });
    await page.goto(new URL('/storehouse', page.url()).href);
    for (const [name, count] of [
      ['Pine logs', 7],
      ['Copper sword', 1],
      ['Copper helm', 1],
    ] as const) {
      const tile = page.locator('[data-slot="store.items"] [data-ui="ItemTile"]', { hasText: name });
      await tile.waitFor({ timeout: 10_000 });
      const n = Number(((await tile.textContent()) ?? '').replace(/[^0-9]/g, ''));
      if (n !== count) problems.push(`Retreat: ${n} ${name.toLowerCase()} after the retreat, not ${count}`);
    }
    const bread = page.locator('[data-slot="store.items"] [data-ui="ItemTile"]', { hasText: 'Bread' });
    if (await bread.count()) problems.push('Retreat: bread is left, so the fighter retreated with food in hand');
  } catch (err) {
    problems.push(`Retreat: the page did not show a retreat that cost nothing (${say(err)})`);
  } finally {
    await page.close();
  }
}

export async function runCombatProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  await wearFromThePage(served, problems);
  await retreatCostsNothing(served, problems);
  return problems;
}
