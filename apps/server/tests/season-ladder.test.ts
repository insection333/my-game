// A season's own ladder (session 165): the goals done since the season opened (each set by the player's own
// pace), so a friend who joins late stands level with a veteran, and every player starts again each eight
// weeks. A veteran's goals from before the season count for nothing on it; a player new in the season counts
// from nothing; it is named "season" whichever season it is, and ranks by goals alone.
import type { HiscoresResponse } from '@idle-clash/contracts';
import { goalsOf, seasonAt } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { hiscores, players } from '../src/db/schema.ts';
import { keepHouse } from '../src/housekeeping.ts';
import { server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const DAY = 86_400_000;
const EPOCH = Date.UTC(2026, 10, 2);
const ladders = async (cookie: string) =>
  JSON.parse(
    (await s.app.inject({ method: 'GET', url: '/api/hiscores', headers: { cookie } })).body,
  ) as HiscoresResponse;
const idOf = async (cookie: string) =>
  (
    JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
      player: { id: string };
    }
  ).player.id;
/** Gives a player's save `goals` done (and XP to match) and records it at the clock's time, listed. */
const record = async (who: string, goals: number) => {
  const id = who.includes('=') ? await idOf(who) : who;
  const saved = s.ctx.store.read(id, s.clock.now)!;
  const st = saved.doc.state;
  const state: State = {
    ...st,
    skills: { woodcutting: { xp: goals * 1_000 } },
    features: { ...st.features, goals: { ...goalsOf(st), opened: goals } },
  };
  s.ctx.store.write(id, { ...saved.doc, state }, saved.rev, s.clock.now);
  s.ctx.hiscores.update(id, state, s.clock.now);
  s.ctx.db.update(players).set({ firstActAt: 0, listedAt: s.clock.now }).where(eq(players.id, id)).run();
  s.ctx.hiscores.forget();
};

describe("a season's ladder", () => {
  it('counts goals from the season opening, a newcomer from nothing, and ranks by them alone', async () => {
    s = await server();
    s.clock.now = EPOCH + 55 * DAY;
    const elder = await signUp(s, 'Elderwood');
    const late = await signUp(s, 'Latecomer');
    await record(elder, 900);
    s.clock.now = EPOCH + 57 * DAY; // the second season
    expect(seasonAt(s.clock.now)!.number).toBe(2);
    await record(elder, 905);
    await record(late, 8);
    const board = (await ladders(late)).ladders;
    expect(board.map((l) => l.skill).slice(0, 3)).toEqual(['total', 'season', 'woodcutting']);
    const season = board.find((l) => l.skill === 'season')!;
    expect(season.rows.map((r) => [r.name, r.xp])).toEqual([
      ['Latecomer', 8],
      ['Elderwood', 5],
    ]);
    expect(season.you).toMatchObject({ rank: 1, xp: 8 });
    // On Total the elder stands first, as ever.
    expect(board.find((l) => l.skill === 'total')!.rows[0].name).toBe('Elderwood');
  });

  it('opens a fresh ladder with the next season, and lets go of those before the last', async () => {
    s = await server();
    s.clock.now = EPOCH + DAY;
    const a = await idOf(await signUp(s, 'Ashgrove'));
    await record(a, 1);
    await record(a, 4);
    expect(s.ctx.hiscores.ladder('season:1', a).you).toMatchObject({ xp: 4 });
    s.clock.now = EPOCH + 57 * DAY;
    await record(a, 9);
    expect(s.ctx.hiscores.ladder('season:2', a).you).toMatchObject({ xp: 5 });
    s.clock.now = EPOCH + 113 * DAY; // the third season: the first's rows go
    keepHouse(s.ctx);
    const kept = s.ctx.db
      .selectDistinct({ skill: hiscores.skill })
      .from(hiscores)
      .all()
      .map((r) => r.skill);
    expect(kept).toContain('season:2');
    expect(kept.filter((k) => k.endsWith(':1'))).toEqual([]);
  });

  it("leaves a player's places on their card to the skills and Total", async () => {
    s = await server();
    s.clock.now = EPOCH + DAY;
    const a = await signUp(s, 'Oakheart');
    await record(a, 50);
    const places = s.ctx.hiscores.placesOf(await idOf(a));
    expect(places.map((p) => p.skill)).toEqual(['total', 'woodcutting']);
  });
});

// Session 266: a friend's gift opens a supply cache, and the ladder counted caches opened, so three friends
// gifting each other daily climbed it by three goals a day without doing one.
describe("a season's ladder and gifts", () => {
  it('counts goals done, not gifts opened', async () => {
    const { seasonEntries } = await import('../src/game/season-ladder.ts');
    const at = EPOCH + 10 * DAY;
    const n = String(seasonAt(at)!.number);
    const { newState } = await import('@idle-clash/kernel');
    const st = newState(3, at);
    st.features.goals = { ...goalsOf(st), opened: 6, gifted: 1 };
    const row = seasonEntries(at, st, new Map([[`seasonfrom:${n}`, { xp: 2 }]])).find((e) => e.skill === `season:${n}`);
    expect(row?.xp).toBe(3);
  });
});
