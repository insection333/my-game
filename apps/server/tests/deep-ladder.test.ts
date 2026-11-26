// The Deep's ladder of the week (session 214): the deepest each player reached this week, ranked by depth (of
// the same depth, who got there first), shown once anyone has gone down, begun again each Monday, and the weeks
// before the last let go.
import type { HiscoresResponse } from '@idle-clash/contracts';
import { XP_TABLE } from '@idle-clash/content';
import { deepOf, kindlingData } from '@idle-clash/features';
import type { State } from '@idle-clash/kernel';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { hiscores, players } from '../src/db/schema.ts';
import { keepHouse } from '../src/housekeeping.ts';
import { server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const DAY = 86_400_000;
const MONDAY = Date.UTC(2026, 10, 23);
const week = (at: number) => new Date(at - ((new Date(at).getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10);
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
/** A player's save reaching `depth` in the Deep this week, recorded at the clock's time, listed. */
const reach = async (cookie: string, depth: number) => {
  const id = await idOf(cookie);
  const saved = s.ctx.store.read(id, s.clock.now)!;
  const st = saved.doc.state;
  const e = st.features.expeditions ?? {
    marks: 0,
    relics: {},
    drawn: 0,
    run: null,
    bossDay: {},
    wins: {},
    runs: {},
    twists: [],
  };
  const deep = { ...deepOf(st), deepest: depth, week: week(s.clock.now), weekDeepest: depth };
  const state: State = {
    ...st,
    skills: { hitpoints: { xp: 13_100_000 } },
    features: { ...st.features, expeditions: { ...e, deep } },
  };
  s.ctx.store.write(id, { ...saved.doc, state }, saved.rev, s.clock.now);
  s.ctx.hiscores.update(id, state, s.clock.now);
  s.ctx.db.update(players).set({ firstActAt: 0, listedAt: s.clock.now }).where(eq(players.id, id)).run();
  s.ctx.hiscores.forget();
};

describe("the Deep's ladder", () => {
  it('is not shown while no one has gone down this week', async () => {
    s = await server();
    s.clock.now = MONDAY + DAY;
    const a = await signUp(s, 'Ashgrove');
    expect((await ladders(a)).ladders.map((l) => l.skill)).not.toContain('deep');
  });

  it('ranks the deepest this week, the first there above, with no level column', async () => {
    s = await server();
    s.clock.now = MONDAY + DAY;
    const a = await signUp(s, 'Ashgrove');
    const b = await signUp(s, 'Birchfall');
    const c = await signUp(s, 'Cindermoor');
    await reach(a, 23);
    s.clock.now += 60_000;
    await reach(b, 31);
    await reach(c, 23);
    const deep = (await ladders(c)).ladders.find((l) => l.skill === 'deep')!;
    expect(deep.rows.map((r) => [r.name, r.xp])).toEqual([
      ['Birchfall', 31],
      ['Ashgrove', 23],
      ['Cindermoor', 23],
    ]);
    expect(deep.you).toMatchObject({ rank: 3 });
  });

  it('begins again next Monday, and lets go of the weeks before the last', async () => {
    s = await server();
    s.clock.now = MONDAY + DAY;
    const a = await signUp(s, 'Ashgrove');
    await reach(a, 12);
    s.clock.now = MONDAY + 8 * DAY;
    expect((await ladders(a)).ladders.map((l) => l.skill)).not.toContain('deep');
    await reach(a, 14);
    s.clock.now = MONDAY + 15 * DAY;
    keepHouse(s.ctx);
    const kept = s.ctx.db
      .selectDistinct({ skill: hiscores.skill })
      .from(hiscores)
      .all()
      .map((r) => r.skill)
      .filter((k) => k.startsWith('deep:'));
    expect(kept).toEqual(['deep:2026-11-30']);
  });

  // Session 271: each week's ladder, and each player's row in it, stayed in the server's memory for as long as it
  // ran; what housekeeping lets go of in the table goes from memory too.
  it('lets go of the weeks past keeping in memory as well', async () => {
    s = await server();
    s.clock.now = MONDAY + DAY;
    const a = await signUp(s, 'Ashgrove');
    await reach(a, 12);
    await ladders(a);
    const week1 = s.ctx.hiscores.held();
    s.clock.now = MONDAY + 8 * DAY;
    await reach(a, 14);
    await ladders(a);
    s.clock.now = MONDAY + 15 * DAY;
    await reach(a, 16);
    await ladders(a);
    const before = s.ctx.hiscores.held();
    keepHouse(s.ctx);
    const after = s.ctx.hiscores.held();
    // The first week's row is let go; this week's and last week's are kept.
    expect(after.rows).toBe(before.rows - 1);
    expect(after.keys.some((k) => k === 'deep:2026-11-23')).toBe(false);
    expect(before.rows).toBeGreaterThan(week1.rows);
  });

  it("leaves a player's places on their card to the skills and Total", async () => {
    s = await server();
    s.clock.now = MONDAY + DAY;
    const a = await signUp(s, 'Oakheart');
    await reach(a, 40);
    expect(s.ctx.hiscores.placesOf(await idOf(a)).map((p) => p.skill)).not.toContain('deep:2026-11-23');
  });
});

describe('the Kindlings ladder', () => {
  it('counts every Kindling across every skill, and is shown once anyone has kindled', async () => {
    s = await server();
    s.clock.now = MONDAY + DAY;
    const a = await signUp(s, 'Ashgrove');
    const b = await signUp(s, 'Birchfall');
    expect((await ladders(a)).ladders.map((l) => l.skill)).not.toContain('kindlings');
    const kindle = async (cookie: string, skills: Record<string, number>) => {
      const id = await idOf(cookie);
      const saved = s.ctx.store.read(id, s.clock.now)!;
      const state: State = {
        ...saved.doc.state,
        skills: Object.fromEntries(
          Object.entries(skills).map(([k, n]) => [k, { xp: XP_TABLE[99] + n * kindlingData.KINDLE_XP }]),
        ),
      };
      s.ctx.store.write(id, { ...saved.doc, state }, saved.rev, s.clock.now);
      s.ctx.hiscores.update(id, state, s.clock.now);
      s.ctx.db.update(players).set({ firstActAt: 0, listedAt: s.clock.now }).where(eq(players.id, id)).run();
      s.ctx.hiscores.forget();
    };
    await kindle(a, { woodcutting: 3, mining: 2 });
    await kindle(b, { fishing: 4 });
    const ladder = (await ladders(b)).ladders.find((l) => l.skill === 'kindlings')!;
    expect(ladder.rows.map((r) => [r.name, r.xp])).toEqual([
      ['Ashgrove', 5],
      ['Birchfall', 4],
    ]);
    expect(s.ctx.hiscores.placesOf(await idOf(a)).map((p) => p.skill)).not.toContain('kindlings:all');
  });
});
