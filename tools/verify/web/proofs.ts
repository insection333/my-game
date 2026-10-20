// Part of step 6, in Chromium: session 6's proofs in the page itself.
// - A newcomer starts within 30 seconds: from the first page to a lane at work, on a throttled phone,
//   with time added for a person to read, type and tap.
// - A rare find has its moment: a player's next chop is set to turn up a Rare find (as the admin page
//   will be able to set a save up); the page must show it, and the collection log must record it.
import { RARE_CHANCE, LEGENDARY_CHANCE } from '@idle-clash/content';
import { MINUTE, seeded } from '@idle-clash/kernel';
import { newcomer, openPage, type Served } from './session.ts';

/** A person's pace: a quarter second a character typed, a second and a half to read and tap. */
const PER_CHAR = 0.25;
const PER_TAP = 1.5;
export const NEWCOMER_BUDGET_S = 30;

export interface Proofs {
  problems: string[];
  newcomerSeconds: number;
}

async function newcomerStarts(served: Served, problems: string[]): Promise<number> {
  const page = await openPage('chromium', '/welcome', { viewport: { width: 390, height: 844 } });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 200_000,
    uploadThroughput: 94_000,
  });
  const name = 'First Timer';
  const password = 'a fine long secret';
  let human = 0;
  const start = Date.now();
  try {
    await page.goto(served.url + '/');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Password').fill(password);
    human += (name.length + password.length) * PER_CHAR;
    await page.getByLabel('I am 13 or older').check();
    await page.getByRole('button', { name: 'Create account' }).click();
    human += 2 * PER_TAP;
    const go = page.getByRole('button', { name: 'Start chopping' });
    await go.waitFor({ timeout: 20_000 });
    // A step that cannot start yet says what it needs, in place of its button.
    if (!(await page.locator('[data-slot="hearth.goals"]').getByText('Needs Smithing level 2').count()))
      problems.push('Newcomer: the sword step does not say it needs Smithing level 2');
    const sent = page.waitForResponse((r) => r.url().endsWith('/api/game/command'));
    await go.click();
    human += PER_TAP;
    await sent;
    await page.locator('[data-slot="shell.lane"]').getByText('Pine tree').first().waitFor({ timeout: 10_000 });
  } catch (err) {
    problems.push(
      `Newcomer: could not start a lane (${err instanceof Error ? err.message.split('\n')[0] : String(err)})`,
    );
  } finally {
    await page.close();
  }
  const total = (Date.now() - start) / 1000 + human;
  if (total > NEWCOMER_BUDGET_S)
    problems.push(
      `Newcomer: a lane was working after ${total.toFixed(1)} s at a person's pace; the target is under ${NEWCOMER_BUDGET_S} s`,
    );
  return total;
}

async function rareFindMoment(served: Served, problems: string[]) {
  const cookie = await newcomer(served.url, 'Lucky Finder');
  const me = (await (
    await fetch(`${served.url}/api/me`, { headers: { cookie: `${cookie.name}=${cookie.value}` } })
  ).json()) as {
    player: { id: string };
  };
  const { store, engine } = served.ctx;
  const now = Date.now();
  const saved = store.read(me.player.id, now)!;
  const s = engine.command(
    saved.doc.state,
    now,
    { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } },
    seeded(saved.doc.state.seed),
  ).state;
  // The chop ends in 4 seconds, and its first roll (the find's) lands in the Rare band.
  const rng = seeded(s.seed);
  let c = s.lanes.gathering.rolls;
  while (!(rng('gathering', c) >= LEGENDARY_CHANCE && rng('gathering', c) < RARE_CHANCE)) c++;
  s.lanes.gathering.rolls = c;
  s.lanes.gathering.current = {
    action: { feature: 'woodcutting', id: 'pine-tree' },
    startedAt: now - 3500,
    endsAt: now + 4000,
  };
  s.luck.lastMoment = now - MINUTE;
  store.write(me.player.id, { ...saved.doc, state: s }, saved.rev, now);

  const page = await openPage('chromium', '/skills/woodcutting', { viewport: { width: 390, height: 844 } });
  await page.context().addCookies([{ ...cookie, url: served.url }]);
  try {
    await page.goto(`${served.url}/skills/woodcutting`);
    const moment = page.locator('[data-slot="shell.moment"] [data-ui="Moment"]', {
      hasText: 'Rare find: Carved acorn',
    });
    await moment.waitFor({ timeout: 15_000 });
    if ((await moment.getAttribute('data-size')) !== 'banner') problems.push('Rare find: its moment is not a banner');
    if (!(await moment.locator('[data-icon="carved-acorn"]').count()))
      problems.push('Rare find: its moment has no icon');
    if (!(await moment.getByText('New in your collection log.').count()))
      problems.push('Rare find: its moment does not say it is new in the collection log');
    await page.goto(`${served.url}/storehouse/log`);
    const entry = page.locator('[data-slot="collection.log"] li', { hasText: 'Carved acorn' });
    await entry.waitFor({ timeout: 10_000 });
    if ((await entry.getAttribute('data-found')) === null)
      problems.push('Rare find: the collection log does not show it found');
    const kept = (
      await page.evaluate(
        async () => (await (await fetch('/api/game')).json()) as { state: { items: Record<string, number> } },
      )
    ).state.items['carved-acorn'];
    if (kept !== 1) problems.push(`Rare find: the server has ${kept ?? 0} carved acorns, not the 1 the page showed`);
  } catch (err) {
    problems.push(
      `Rare find: no moment was shown (${err instanceof Error ? err.message.split('\n')[0] : String(err)})`,
    );
  } finally {
    await page.close();
  }
}

export async function runProofs(served: Served): Promise<Proofs> {
  const problems: string[] = [];
  const newcomerSeconds = await newcomerStarts(served, problems);
  await rareFindMoment(served, problems);
  return { problems, newcomerSeconds };
}
