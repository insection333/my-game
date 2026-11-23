// The realm's work of the season on the server (session 218): gifts counted from the saves' own events; the
// work asks a share for each player who gave the season before (the least for a realm of one); each stage is
// told to everyone who gave; finished, it is a work raised with each giver's part, thanked by name; a gift to a
// finished work counts for nothing more, and a deleted account's gifts go.
import { REALM_WORK, realmWorkIn, seasonAt } from '@idle-clash/features';
import type { GameEvent } from '@idle-clash/kernel';
import { afterEach, describe, expect, it } from 'vitest';
import { server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const DAY = 86_400_000;
/** A day in season 2 (from 28 December 2026), and one in season 3. */
const IN2 = Date.UTC(2027, 0, 5, 12);
const IN3 = IN2 + 56 * DAY;
const idOf = async (cookie: string) =>
  (
    JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
      player: { id: string };
    }
  ).player.id;
const gift = (at: number, worth: number): GameEvent => {
  const season = seasonAt(at)!.number;
  return { type: 'realmGiven', at, season, work: realmWorkIn(season), worth };
};

describe("the realm's work on the server", () => {
  it('asks the least of a realm with no givers before, tells each stage to every giver, and thanks them', async () => {
    s = await server();
    const [a, b] = [await idOf(await signUp(s, 'Alder')), await idOf(await signUp(s, 'Birch'))];
    const heard: [string, GameEvent[]][] = [];
    s.ctx.realmWorks.onStage = (id, events) => void heard.push([id, events]);
    expect(s.ctx.realmWorks.standing(a, IN2)).toMatchObject({
      season: 2,
      work: 'bridge',
      needed: REALM_WORK.LEAST,
      given: 0,
      givers: 0,
      finished: 0,
      thanks: null,
    });
    // Alder gives a fifth: the first stage, told to Alder; Birch then gives the rest, told to both.
    s.ctx.realmWorks.heard(a, [gift(IN2, REALM_WORK.LEAST / 5)]);
    expect(heard).toEqual([[a, [expect.objectContaining({ type: 'realmWorkStage', stage: 1, work: 'bridge' })]]]);
    s.ctx.realmWorks.heard(b, [gift(IN2 + 1000, REALM_WORK.LEAST)]);
    const stages = heard.slice(1).map(([id, [e]]) => `${id === a ? 'A' : 'B'}${(e as { stage: number }).stage}`);
    expect(stages.sort()).toEqual(['A2', 'A3', 'A4', 'A5', 'B2', 'B3', 'B4', 'B5']);
    expect(s.ctx.realmWorks.standing(b, IN2)).toMatchObject({
      given: REALM_WORK.LEAST,
      mine: REALM_WORK.LEAST,
      givers: 2,
      finished: 1,
      thanks: { season: 2, work: 'bridge', names: ['Alder', 'Birch'], more: 0 },
    });
    // A gift to a finished work counts for nothing more.
    s.ctx.realmWorks.heard(a, [gift(IN2 + 2000, 999)]);
    expect(s.ctx.realmWorks.standing(a, IN2).mine).toBe(REALM_WORK.LEAST / 5);
  });

  it('asks a share for each player who gave the season before, and lets a deleted account’s gifts go', async () => {
    s = await server();
    const ids = [
      await idOf(await signUp(s, 'Alder')),
      await idOf(await signUp(s, 'Birch')),
      await idOf(await signUp(s, 'Cedar')),
    ];
    for (const id of ids) s.ctx.realmWorks.heard(id, [gift(IN2, 1_000)]);
    expect(s.ctx.realmWorks.standing(ids[0], IN3)).toMatchObject({
      season: 3,
      work: 'great-hall',
      needed: 3 * REALM_WORK.PER_GIVER,
    });
    s.ctx.realmWorks.remove(ids[0]);
    expect(s.ctx.realmWorks.standing(ids[1], IN2)).toMatchObject({ givers: 2, given: 2_000 });
  });
});
