// Part of step 6, in Chromium at 390 px: the plan of 26 November's fifth phase, played in the page (the audit
// of session 255), where its tests had held the rules and the server alone.
// - Days banked (session 253): a boss last fought three days ago says "3 fights banked" on its row, and Fight
//   today's bosses counts each banked fight.
// - Cheers (session 254): a friend's card offers Cheer for their week's climb; pressed, it says Cheered, and the
//   friend hears it; a gift from an account made today says why it cannot go.
// - A gift (session 254): one waiting stands in the Hearth's Next up, leads to its sheet, and Open answers with
//   what the cache held.
import { XP_TABLE } from '@idle-clash/content';
import { endTour, playerWith } from './proofs-lanes.ts';
import { newcomer, type Served } from './session.ts';

const DAY = 86_400_000;
const worn = { weapon: 'dawnsteel-sword', helm: 'dawnsteel-helm', body: 'dawnsteel-body', legs: 'dawnsteel-legs' };

const idOf = (served: Served, name: string) =>
  (served.ctx.store.sqlite.prepare('select id from players where name = ?').get(name) as { id: string }).id;

async function banked(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Banked Fighter', '/combat/expeditions', (s, now) => {
    const day = new Date(now - 3 * DAY).toISOString().slice(0, 10);
    const ids = ['barrow-king', 'troll-chief', 'mire-mother', 'drowned-warden', 'storm-roc', 'ember-wyrm'];
    const e = (s.features.expeditions ?? {}) as Record<string, unknown>;
    return {
      ...s,
      skills: Object.fromEntries(['melee', 'hitpoints', 'archery', 'magic'].map((k) => [k, { xp: XP_TABLE[99] }])),
      items: { ...Object.fromEntries(Object.values(worn).map((i) => [i, 1])), 'sturgeon-stew': 400 },
      features: {
        ...s.features,
        combat: { worn, health: null, healthAt: 0, retreated: null },
        expeditions: {
          marks: 0,
          relics: {},
          drawn: 0,
          run: null,
          wins: {},
          runs: {},
          twists: [],
          ...e,
          bossDay: Object.fromEntries(ids.map((id) => [id, day])),
          bossLeft: Object.fromEntries(ids.map((id) => [id, 0])),
        },
      },
    };
  });
  let step = 'a boss row says its fights banked';
  try {
    await endTour(page);
    await page.reload();
    await page.getByText('3 fights banked').first().waitFor({ timeout: 10_000 });
    step = "Fight today's bosses counts them";
    const round = page.locator('[data-slot="combat.round"]');
    const words = await round
      .getByText(/to fight today/)
      .first()
      .textContent({ timeout: 5_000 });
    const count = Number(/(\d+) to fight today/.exec(words ?? '')?.[1] ?? 0);
    // Three a boss, and the realm's strike (one waiting for a new player).
    if (count < 3 || count % 3 === 2) throw new Error(`the round counts ${count} fights, not three a boss`);
  } catch (err) {
    problems.push(`Days banked: failed where ${step} (${String(err).slice(0, 200)})`);
  } finally {
    await page.close();
  }
}

async function cheer(served: Served, problems: string[]) {
  await newcomer(served.url, 'Cheer Taker');
  const taker = idOf(served, 'Cheer Taker');
  served.ctx.notices.add(taker, [{ type: 'rankUp', at: Date.now(), skill: 'woodcutting', place: 3, band: 3 }]);
  const page = await playerWith(served, 'Cheer Giver', '/?panel=player&name=Cheer%20Taker', (s) => s);
  let step = 'the card offers Cheer for the climb';
  try {
    await endTour(page);
    await page.reload();
    const social = page.locator('[data-slot="player.social"]');
    await social.getByText('Cheer them for reaching 3rd on the Woodcutting hiscores').waitFor({ timeout: 10_000 });
    step = 'the gift says why it cannot go';
    await social.getByText('Gifts open once your account is a week old').waitFor({ timeout: 5_000 });
    step = 'Cheer is pressed and answered';
    await social.getByRole('button', { name: 'Cheer' }).click({ timeout: 5_000 });
    await social.getByText('Cheered').waitFor({ timeout: 5_000 });
    step = 'the friend hears it';
    const heard = served.ctx.notices.list(taker).find((e) => e.type === 'cheered');
    if (!heard || (heard as { from: string }).from !== 'Cheer Giver') throw new Error('no cheer in their notices');
  } catch (err) {
    problems.push(`Cheers: failed where ${step} (${String(err).slice(0, 200)})`);
  } finally {
    await page.close();
  }
}

async function gift(served: Served, problems: string[]) {
  const page = await playerWith(served, 'Gift Taker', '/', (s) => s);
  const giver = idOf(served, 'Cheer Giver');
  const now = Date.now();
  served.ctx.store.sqlite
    .prepare('insert into gifts (from_id, to_id, at, day) values (?, ?, ?, ?)')
    .run(giver, idOf(served, 'Gift Taker'), now, new Date(now).toISOString().slice(0, 10));
  let step = 'Next up names the gift';
  try {
    await endTour(page);
    await page.reload();
    const errand = page.getByRole('link', { name: 'Cheer Giver sent you a gift: open it' });
    await errand.click({ timeout: 10_000 });
    step = 'the sheet offers Open';
    const sheet = page.locator('[data-ui="Sheet"]');
    const row = sheet.locator('[data-ui="ActionRow"]', { hasText: 'From Cheer Giver' });
    await row.getByRole('button', { name: 'Open' }).click({ timeout: 5_000 });
    step = 'Open answers with the cache';
    await page.getByText("Cheer Giver's gift opened").first().waitFor({ timeout: 10_000 });
    await row.waitFor({ state: 'detached', timeout: 5_000 });
  } catch (err) {
    problems.push(`A gift: failed where ${step} (${String(err).slice(0, 200)})`);
  } finally {
    await page.close();
  }
}

export async function runFriendsProofs(served: Served): Promise<string[]> {
  const problems: string[] = [];
  await banked(served, problems);
  await cheer(served, problems);
  await gift(served, problems);
  return problems;
}
