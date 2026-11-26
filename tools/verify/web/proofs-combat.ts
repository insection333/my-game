// Part of step 6, in Chromium: session 8's proofs in the page itself.
// - Gear is worn from the Combat page, and Your odds then rates the hollow rat: Fair for a newcomer
//   with First steps' ten loaves; the Storehouse's tile then marks the sword worn (session 123).
// - A retreat costs nothing: a fighter who took on a hill troll with two loaves an hour ago comes back
//   to the lane stopped with the reason, the sword and helm still worn, and nothing else gone.
// - A region tab brings its foes into view (session 99): on a phone the loadout fills the screen under
//   the tabs, and pressing Fen changed only the tab's underline.
// - A boss fought in the lane is named on its chip (session 108): Fight on the Troll-chief blanked the
//   whole game, its chip asking for a region's short name.
// - The Storehouse finds an item by name once its shelves run long (session 186): forty kinds held, and
//   "copper" leaves the copper ore and the copper bar; a name held by nothing says so.
// - The finds kept to sell go at one press (session 187): asked first, then every bird's nest and amber
//   nugget sold, the carved acorn (a Rare find, with a use) kept, and the sale said.
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
    await page.locator('[data-ui="WeaponSlot"][aria-label="Weapon: Copper sword"]').waitFor({ timeout: 5_000 });
    step = 'Your odds rates the hollow rat Fair';
    await rat.getByText('Fair').waitFor({ timeout: 5_000 });
    await rat.getByRole('button', { name: 'Fight' }).waitFor({ timeout: 5_000 });
    // The Storehouse marks the piece worn on its tile (session 123: only its panel said so).
    step = "the Storehouse's tile marks the sword worn";
    await page.getByRole('link', { name: 'Storehouse' }).first().click();
    const tile = (name: string) => page.locator('[data-ui="ItemTile"]', { hasText: name });
    await tile('Copper sword').getByText('Worn').waitFor({ timeout: 5_000 });
    if (await tile('Bread').getByText('Worn').count()) throw new Error('the bread is marked worn');
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
    // The phone's chip says it short, and is heard in full.
    await page
      .getByRole('button', { name: 'Combat: Out of food, retreated from the hill troll' })
      .filter({ hasText: 'Out of food' })
      .first()
      .waitFor({ timeout: 15_000 });
    await page.locator('[data-ui="WeaponSlot"][aria-label="Weapon: Copper sword"]').waitFor({ timeout: 5_000 });
    await page.locator('[data-ui="GearSlot"][aria-label="Helm: Copper helm"]').waitFor({ timeout: 5_000 });
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

async function regionInView(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Fen Walker', '/combat', (s) => s);
  try {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.getByRole('link', { name: /Fen/ }).first().click();
    await page.waitForFunction(
      () => {
        const r = document.querySelector('[data-slot="combat.foes"]')?.getBoundingClientRect();
        return !!r && r.top >= 0 && r.top < innerHeight / 2;
      },
      undefined,
      { timeout: 3_000 },
    );
  } catch (err) {
    problems.push(`Combat: on a phone, the Fen tab did not bring its foes into view (${say(err)})`);
  } finally {
    await page.close();
  }
}

async function bossFoughtInTheLane(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Boss Hunter', '/combat/expeditions', (s) => ({
    ...s,
    skills: skills({ hitpoints: 60, melee: 40 }),
    items: { 'copper-sword': 1, bread: 50 },
    features: {
      ...s.features,
      combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: s.clock, retreated: null },
    },
  }));
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    const troll = page.locator('[data-slot="combat.bosses"] [data-ui="ActionRow"]', {
      hasText: 'The Troll-chief of the hill',
    });
    await troll.getByRole('button', { name: 'Fight' }).click({ timeout: 10_000 });
    await page
      .locator('[data-ui="LaneChip"]', { hasText: 'The Troll-chief of the hill' })
      .first()
      .waitFor({ timeout: 10_000 });
    if (await page.getByText('Something broke here').count()) problems.push('Combat: Fight on a boss broke the page');
  } catch (err) {
    problems.push(`Combat: a boss fought in the lane was not named on its chip (${say(err)})`);
  } finally {
    await page.close();
  }
}

const SHELVES = [
  'pine-logs',
  'ash-logs',
  'oak-logs',
  'yew-logs',
  'maple-logs',
  'silverbark-logs',
  'elderwood-logs',
  'ancient-logs',
  'copper-ore',
  'tin-ore',
  'iron-ore',
  'coal',
  'moonsilver-ore',
  'star-iron-ore',
  'ember-ore',
  'dawnstone',
  'perch',
  'trout',
  'pike',
  'salmon',
  'moon-carp',
  'silver-eel',
  'ember-char',
  'dawn-sturgeon',
  'copper-bar',
  'bronze-bar',
  'iron-bar',
  'steel-bar',
  'moonsilver-bar',
  'star-iron-bar',
  'embersteel-bar',
  'dawnsteel-bar',
  'bronze-key',
  'iron-key',
  'steel-key',
  'moonsilver-key',
  'star-iron-key',
  'embersteel-key',
  'dawnsteel-key',
  'bread',
];

async function searchTheStorehouse(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Hoarder', '/storehouse', (s) => ({
    ...s,
    items: Object.fromEntries(SHELVES.map((id) => [id, 5])),
    features: { ...s.features, storehouse: { enlargements: 3 } },
  }));
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    const tiles = page.locator('[data-ui="ItemTile"]');
    await tiles.nth(SHELVES.length - 1).waitFor({ timeout: 5_000 });
    await page.getByRole('searchbox', { name: 'Find an item' }).fill('COPPER');
    await page.waitForFunction(() => document.querySelectorAll('[data-ui="ItemTile"]').length === 2, undefined, {
      timeout: 3_000,
    });
    const names = (await tiles.allInnerTexts()).map((x) => x.replace(/\s+/g, ' ').trim());
    if (!names.every((n) => /Copper (ore|bar)/.test(n))) throw new Error(`it left ${names.join(', ')}`);
    await page.getByRole('searchbox', { name: 'Find an item' }).fill('griffin');
    await page.getByText('Nothing you hold goes by that name.').waitFor({ timeout: 3_000 });
  } catch (err) {
    problems.push(`Storehouse: the search did not find an item by its name (${say(err)})`);
  } finally {
    await page.close();
  }
}

async function sellTheFinds(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Nest Keeper', '/storehouse', (s) => ({
    ...s,
    // Amber nuggets are a feast's ingredient (session 245): kept, as a carved acorn with a use is.
    items: { 'birds-nest': 90, 'rough-garnet': 2, 'amber-nugget': 2, 'carved-acorn': 3, 'pine-logs': 40 },
  }));
  try {
    await page.getByRole('button', { name: 'Sell finds for 9,200 gold' }).click({ timeout: 5_000 });
    await page.getByText("Sell every bird's nest and rough garnet for 9,200 gold?").waitFor({ timeout: 3_000 });
    await page.getByRole('button', { name: 'Sell', exact: true }).click();
    await page.getByText('Sold 2 kinds of find for 9,200 gold').waitFor({ timeout: 3_000 });
    const names = (await page.locator('[data-ui="ItemTile"]').allInnerTexts()).join(' ');
    if (/Bird's nest|Rough garnet/.test(names) || !/Carved acorn/.test(names) || !/Amber nugget/.test(names))
      throw new Error(`it left ${names}`);
    if (await page.getByRole('button', { name: /^Sell finds/ }).count()) throw new Error('it still offers the sale');
  } catch (err) {
    problems.push(`Storehouse: the finds kept to sell did not go at one press (${say(err)})`);
  } finally {
    await page.close();
  }
}

export async function runCombatProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  await regionInView(served, problems);
  await bossFoughtInTheLane(served, problems);
  await wearFromThePage(served, problems);
  await retreatCostsNothing(served, problems);
  await searchTheStorehouse(served, problems);
  await sellTheFinds(served, problems);
  return problems;
}
