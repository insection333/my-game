// Part of step 6, in Chromium at 390 px: the plan of 26 November's first phase, played in the page (the audit
// of session 243), where its tests had held the rules alone.
// - Fight today's bosses (session 239) fights them one after another: its row says so, and the boss to come
//   says Next in your lane with no Fight of its own.
// - A lane holds three to come (session 240): Next on three rows, each then offering Not next; the lane names
//   them; a fourth is refused in words; Not next lets one go.
// - Fight as (session 241) puts on the staff at one press; Sell old gear sells the old helms but not the
//   locked one, nor the best of each slot.
// - The Hearth's round (session 242): Claim all takes every goal ready; a deed followed from its sheet stands
//   in Next up; Find a player opens a card by name.
import { XP_TABLE } from '@idle-clash/content';
import type { Page } from 'playwright';
import { endTour, playerWith, run, say } from './proofs-lanes.ts';
import type { Served } from './session.ts';

const skills = (levels: Record<string, number>) =>
  Object.fromEntries(Object.entries(levels).map(([k, l]) => [k, { xp: XP_TABLE[l] }]));
const worn = { weapon: 'dawnsteel-sword', helm: 'dawnsteel-helm', body: 'dawnsteel-body', legs: 'dawnsteel-legs' };

async function tryOn(
  page: Page,
  problems: string[],
  what: string,
  steps: (mark: (s: string) => void) => Promise<void>,
) {
  let step = 'the page opens';
  try {
    await steps((s) => (step = s));
  } catch (err) {
    problems.push(`${what}: failed where ${step} (${say(err)})`);
  } finally {
    await page.close();
  }
}

async function daysBosses(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Boss Rounder', '/combat/expeditions', (s) => ({
    ...s,
    skills: skills({ melee: 99, hitpoints: 99, archery: 99, magic: 99 }),
    items: {
      'dawnsteel-sword': 1,
      'dawnsteel-helm': 1,
      'dawnsteel-body': 1,
      'dawnsteel-legs': 1,
      'sturgeon-stew': 400,
    },
    features: { ...s.features, combat: { worn, health: null, healthAt: 0, retreated: null } },
  }));
  await tryOn(page, problems, "Fight today's bosses", async (mark) => {
    const round = page.locator('[data-slot="combat.round"]');
    mark("the day's bosses are offered");
    await round.getByRole('button', { name: "Fight today's bosses" }).click({ timeout: 10_000 });
    mark('the row says it is in the lane');
    await round.getByText('In your lane').waitFor({ timeout: 5_000 });
    await round.getByText(/left today|The last of/).waitFor({ timeout: 5_000 });
    mark('a boss to come says so, with no Fight');
    const next = page.locator('[data-ui="ActionRow"]', { hasText: 'Next in your lane' }).first();
    await next.waitFor({ timeout: 5_000 });
    if (await next.getByRole('button', { name: 'Fight' }).count()) throw new Error('a boss to come offers Fight');
  });
}

async function threeToCome(served: Served, problems: string[]) {
  const bar = { feature: 'smithing', id: 'copper-bar' };
  const page = await playerWith(served, 'Queue Keeper', '/skills/smithing', (s, now) =>
    run(
      served,
      { ...s, skills: skills({ smithing: 39 }), items: { 'copper-ore': 40, 'tin-ore': 40, 'iron-ore': 40 } },
      now,
      [{ type: 'start', lane: 'artisan', action: bar }],
    ),
  );
  await tryOn(page, problems, 'Three to come', async (mark) => {
    const rows = page.locator('[data-slot="skill.actions"] [data-ui="ActionRow"]');
    // Only a Next that can be pressed: the running row's stands greyed.
    const nexts = () => rows.locator('button:not([disabled])', { hasText: /^Next$/ });
    for (let i = 0; i < 3; i++) {
      mark(`Next on the ${['first', 'second', 'third'][i]} row`);
      await nexts().first().click({ timeout: 5_000 });
      await rows
        .getByRole('button', { name: /^Take .* out of Next$/ })
        .nth(i)
        .waitFor({ timeout: 5_000 });
    }
    mark('a fourth is refused in words');
    await nexts().first().click({ timeout: 5_000 });
    await page.getByText('Your lane holds 3 to come: let one go first').first().waitFor({ timeout: 5_000 });
    mark('Not next lets one go');
    await rows
      .getByRole('button', { name: /^Take .* out of Next$/ })
      .first()
      .click();
    await page.waitForFunction(
      () => document.querySelectorAll('button[aria-label^="Take "][aria-label$=" out of Next"]').length === 2,
      undefined,
      { timeout: 5_000 },
    );
  });
}

async function fightAsAndTidy(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Tidy Fighter', '/combat', (s) => ({
    ...s,
    skills: skills({ melee: 42, magic: 42, hitpoints: 42 }),
    items: { 'iron-sword': 1, 'moonsilver-staff': 1, 'copper-helm': 6, 'bronze-helm': 2, 'iron-helm': 1, bread: 20 },
    features: {
      ...s.features,
      combat: { worn: { weapon: 'iron-sword', helm: 'iron-helm' }, health: null, healthAt: 0, retreated: null },
      storehouse: { enlargements: 0, locked: ['bronze-helm'] },
    },
  }));
  await tryOn(page, problems, 'Fight as and Sell old gear', async (mark) => {
    mark('Fight as Magic puts on the staff');
    await page.getByRole('button', { name: /^Fight as Magic/ }).click({ timeout: 10_000 });
    await page.locator('[data-ui="WeaponSlot"][aria-label="Weapon: Moonsilver staff"]').waitFor({ timeout: 5_000 });
    mark('Sell old gear is offered and asks first');
    await page.getByRole('link', { name: 'Storehouse' }).first().click();
    await page.locator('[data-sell-gear]').click({ timeout: 10_000 });
    await page.locator('[data-answer]').click({ timeout: 5_000 });
    mark('the copper helms are gone, the locked bronze and the iron kept');
    const tile = (name: string) => page.locator('[data-ui="ItemTile"]', { hasText: name });
    await tile('Copper helm').waitFor({ state: 'detached', timeout: 5_000 });
    await tile('Bronze helm').waitFor({ timeout: 5_000 });
    await tile('Iron helm').waitFor({ timeout: 5_000 });
  });
}

async function hearthRound(served: Served, problems: string[]) {
  const name = 'Round Walker';
  const page = await playerWith(served, name, '/', (s) => ({
    ...s,
    skills: skills({ woodcutting: 3, mining: 3, smithing: 3 }),
    items: { 'copper-sword': 1, 'copper-bar': 1, 'copper-ore': 4, 'pine-logs': 9 },
    mastery: {
      'woodcutting:pine-tree': 9,
      'mining:copper-vein': 6,
      'smithing:copper-bar': 2,
      'smithing:copper-sword': 1,
      'combat:hollow-rat': 2,
    },
    features: {
      ...s.features,
      combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null },
    },
  }));
  await tryOn(page, problems, "The Hearth's round", async (mark) => {
    await endTour(page);
    await page.reload();
    mark('Claim all is offered and takes every goal');
    // Claim all stands in the goals panel's head, above the slot.
    const goals = page.locator('section', { has: page.locator('[data-slot="hearth.goals"]') });
    await goals.getByRole('button', { name: /^Claim all \d+$/ }).click({ timeout: 10_000 });
    await page.waitForFunction(
      () => ![...document.querySelectorAll('[data-slot="hearth.goals"] button')].some((b) => b.textContent === 'Claim'),
      undefined,
      { timeout: 5_000 },
    );
    mark('a deed is followed from its sheet');
    await page.goto(new URL('/?panel=deed&deed=level-woodcutting-10', page.url()).href);
    await page.getByRole('button', { name: 'Follow on the Hearth' }).click({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Stop following' }).waitFor({ timeout: 5_000 });
    await page.keyboard.press('Escape');
    mark('the deed stands in Next up');
    await page.locator('[data-ui="ActionRow"]', { hasText: 'Woodcutting 10' }).first().waitFor({ timeout: 5_000 });
    mark('Find a player opens their card');
    await page.goto(new URL('/hiscores', page.url()).href);
    await page.getByLabel('Find a player').fill(name);
    await page.getByRole('button', { name: 'Find', exact: true }).click();
    await page.getByRole('dialog').getByRole('heading', { name }).waitFor({ timeout: 10_000 });
  });
}

export async function runRoundProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  await daysBosses(served, problems);
  await threeToCome(served, problems);
  await fightAsAndTidy(served, problems);
  await hearthRound(served, problems);
  return problems;
}
