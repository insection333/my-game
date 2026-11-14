// Part of step 6, in Chromium: session 7's proofs in the page itself. Each player's save is set up the
// way the admin page will be able to (session 9), then the page is opened as that player.
// - Every lane stop says why: a forge that runs out of ore says so in its lane and in a notice.
// - A queued action starts while away: a smith who queued a sword behind bars and left three hours ago
//   comes back to swords in the Storehouse and the forge stopped, saying why.
// - A chip keeps its words whole (session 86): beside a fight, the resting Gathering chip read "Gatherin / g"
//   on a phone, its word split where the working chip took twice the room; and an expedition set out
//   (session 103) read "Expeditio / n into th…" in four lanes on a phone.
import { HOUR, seeded, type Command, type State } from '@idle-clash/kernel';
import type { Page } from 'playwright';
import { newcomer, openPage, type Served } from './session.ts';

export const say = (err: unknown) => (err instanceof Error ? err.message.split('\n')[0] : String(err));

/** A new player whose save is then changed by `setUp`, and a page signed in as them. */
export async function playerWith(
  served: Served,
  name: string,
  path: string,
  setUp: (s: State, now: number) => State,
): Promise<Page> {
  const cookie = await newcomer(served.url, name);
  const me = (await (
    await fetch(`${served.url}/api/me`, { headers: { cookie: `${cookie.name}=${cookie.value}` } })
  ).json()) as {
    player: { id: string };
  };
  const { store } = served.ctx;
  const now = Date.now();
  const saved = store.read(me.player.id, now)!;
  store.write(me.player.id, { ...saved.doc, state: setUp(saved.doc.state, now) }, saved.rev, now);
  const page = await openPage('chromium', path, { viewport: { width: 390, height: 844 } });
  await page.context().addCookies([{ ...cookie, url: served.url }]);
  await page.goto(served.url + path);
  return page;
}

export const run = (served: Served, s: State, at: number, cmds: Command[]) =>
  cmds.reduce((st, c) => served.ctx.engine.command(st, at, c, seeded(st.seed)).state, s);

const bar = { feature: 'smithing', id: 'copper-bar' };
const sword = { feature: 'smithing', id: 'copper-sword' };

async function stopSaysWhy(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Short Of Ore', '/skills/smithing', (s, now) =>
    run(served, { ...s, items: { 'copper-ore': 2 } }, now, [{ type: 'start', lane: 'artisan', action: bar }]),
  );
  try {
    await page.locator('[data-slot="shell.lane"]').getByText('Out of copper ore').first().waitFor({ timeout: 25_000 });
    await page
      .locator('[data-slot="shell.moment"] [data-ui="Moment"]', { hasText: 'Artisan stopped: out of copper ore' })
      .waitFor({ timeout: 5_000 });
    // The chip opens the lane, which offers what puts it right: copper ore's panel, saying where it
    // comes from.
    await page.getByRole('button', { name: 'Artisan: Out of copper ore' }).click();
    await page.getByRole('button', { name: 'Where to get copper ore' }).click({ timeout: 5_000 });
    await page
      .locator('[data-ui="Sheet"]', { hasText: 'Copper ore' })
      .getByRole('link', { name: /^Mining: Copper/ })
      .first()
      .waitFor({ timeout: 5_000 });
  } catch (err) {
    problems.push(`Lane stop: the page did not say why the forge stopped, or what puts it right (${say(err)})`);
  } finally {
    await page.close();
  }
}

async function queuedWhileAway(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Away Smith', '/storehouse', (s, now) => {
    // The player was last here three hours ago, when they started smelting and queued the sword.
    const then = now - 3 * HOUR;
    const before: State = { ...s, clock: then, lastSeen: then, fireUntil: then, luck: { misses: 0, lastMoment: then } };
    return run(served, { ...before, items: { 'copper-ore': 30 } }, then, [
      { type: 'start', lane: 'artisan', action: bar },
      { type: 'queueNext', lane: 'artisan', action: sword },
    ]);
  });
  try {
    const tile = page.locator('[data-slot="store.items"] [data-ui="ItemTile"]', { hasText: 'Copper sword' });
    await tile.waitFor({ timeout: 15_000 });
    const swords = Number(((await tile.textContent()) ?? '').replace(/[^0-9]/g, ''));
    if (!(swords >= 8))
      problems.push(`Away: ${swords} copper swords after three hours; the queued forging did not run`);
    await page.locator('[data-slot="shell.lane"]').getByText('Out of copper bar').first().waitFor({ timeout: 5_000 });
  } catch (err) {
    problems.push(`Away: the queued action's work is not on the page (${say(err)})`);
  } finally {
    await page.close();
  }
}

/** Words in the phone's lane chips broken across lines, as "word" each. */
const brokenWords = (page: Page) =>
  page.$$eval('[data-ui="LaneChip"]', (chips) =>
    chips.flatMap((chip) => {
      const out: string[] = [];
      const walk = document.createTreeWalker(chip, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const text = n.textContent ?? '';
        for (const m of text.matchAll(/\S+/g)) {
          const r = document.createRange();
          r.setStart(n, m.index);
          r.setEnd(n, m.index + m[0].length);
          if (new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size > 1) out.push(m[0]);
        }
      }
      return out;
    }),
  );

async function chipsKeepWords(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Rail Watcher', '/combat', (s, now) =>
    run(
      served,
      {
        ...s,
        fireUntil: now + 5 * 60_000,
        items: { 'copper-sword': 1, bread: 50 },
        features: {
          ...s.features,
          combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: now, retreated: null },
        },
      },
      now,
      [{ type: 'start', lane: 'combat', action: { feature: 'combat', id: 'hollow-rat' } }],
    ),
  );
  try {
    await page.locator('[data-ui="LaneChip"]').nth(3).waitFor({ timeout: 10_000 });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(200);
      const broken = await brokenWords(page);
      if (broken.length) problems.push(`Lane chips at ${width} px split a word across lines: ${broken.join(', ')}`);
    }
  } catch (err) {
    problems.push(`Lane chips: four lanes beside a fight did not show (${say(err)})`);
  } finally {
    await page.close();
  }
}

/** An expedition set out from its tab, with the fire lit, a tree chopped and bars smelted: four chips, three at work. */
async function runChipKeepsWords(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Far Walker', '/combat/expeditions', (s, now) =>
    run(
      served,
      {
        ...s,
        fireUntil: now + 5 * 60_000,
        items: { 'copper-sword': 1, bread: 50, 'copper-ore': 500 },
        features: {
          ...s.features,
          combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: now, retreated: null },
        },
      },
      now,
      [
        { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } },
        { type: 'start', lane: 'artisan', action: { feature: 'smithing', id: 'copper-bar' } },
      ],
    ),
  );
  try {
    await page
      .getByRole('button', { name: /^Go by / })
      .first()
      .click({ timeout: 10_000 });
    await page.locator('[data-ui="LaneChip"]').nth(3).waitFor({ timeout: 10_000 });
    await page.locator('[data-ui="LaneChip"]:not([data-idle])').nth(1).waitFor({ timeout: 10_000 });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(200);
      const broken = await brokenWords(page);
      if (broken.length)
        problems.push(`Lane chips with an expedition out at ${width} px split a word: ${broken.join(', ')}`);
    }
  } catch (err) {
    problems.push(`Lane chips: an expedition set out beside the fire did not show (${say(err)})`);
  } finally {
    await page.close();
  }
}

export async function runLaneProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  await chipsKeepWords(served, problems);
  await runChipKeepsWords(served, problems);
  await stopSaysWhy(served, problems);
  await queuedWhileAway(served, problems);
  return problems;
}
