// Hiscores: kept as saves change and as pages read them; ranked by XP, ties to whoever got there first; your own entry
// wherever it is; banned players left out; and how many are online. A player is listed once one of their actions
// comes half an hour or more after their first (session 20); until then only they see their place.
import type { HiscoresResponse } from '@idle-clash/contracts';
import { XP_TABLE } from '@idle-clash/content';
import type { State } from '@idle-clash/kernel';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { players } from '../src/db/schema.ts';
import { hearWatching } from '../src/game/watching.ts';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const pine = { feature: 'woodcutting', id: 'pine-tree' };
const ladders = async (cookie: string) =>
  JSON.parse(
    (await s.app.inject({ method: 'GET', url: '/api/hiscores', headers: { cookie } })).body,
  ) as HiscoresResponse;
const chop = async (cookie: string, id: string, minutes: number) => {
  await post(
    s,
    '/api/game/command',
    { requestId: `req-hs-${id}-start`, command: { type: 'start', lane: 'gathering', action: pine } },
    cookie,
  );
  s.clock.now += minutes * 60_000;
  // Stopped, so the lane does not run on while others chop.
  await post(
    s,
    '/api/game/command',
    { requestId: `req-hs-${id}-stop`, command: { type: 'stop', lane: 'gathering' } },
    cookie,
  );
};
/** Lists every player now, as if each had played a while. */
const listAll = () => s.ctx.db.update(players).set({ firstActAt: 0, listedAt: s.clock.now }).run();
/** Gives a player's save this state and records it on the hiscores at `at`, as a player who has played a while. */
const record = async (cookie: string, make: (s: State) => State, at: number) => {
  const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
    player: { id: string };
  };
  const saved = s.ctx.store.read(me.player.id, s.clock.now)!;
  const state = make(saved.doc.state);
  s.ctx.store.write(me.player.id, { ...saved.doc, state }, saved.rev, s.clock.now);
  s.ctx.hiscores.update(me.player.id, state, at);
  s.ctx.db.update(players).set({ firstActAt: 0, listedAt: s.clock.now }).where(eq(players.id, me.player.id)).run();
};

describe('hiscores', () => {
  it('ranks by XP, pins your own entry, and leaves out banned players', async () => {
    s = await server();
    const a = await signUp(s, 'Alder');
    const b = await signUp(s, 'Birch');
    const c = await signUp(s, 'Cedar');
    expect((await ladders(c)).ladders.find((l) => l.skill === 'woodcutting')).toEqual({
      skill: 'woodcutting',
      rows: [],
      you: null,
    });
    await chop(a, 'a', 30);
    await chop(b, 'b', 45);
    const wc = (await ladders(a)).ladders.find((l) => l.skill === 'woodcutting')!;
    expect(wc.rows.map((r) => [r.rank, r.name])).toEqual([
      [1, 'Birch'],
      [2, 'Alder'],
    ]);
    expect(wc.you).toMatchObject({ rank: 2, name: 'Alder' });
    expect(wc.rows[0].level).toBeGreaterThan(wc.rows[1].level);
    const total = (await ladders(a)).ladders.find((l) => l.skill === 'total')!;
    expect(total.rows[0]).toMatchObject({ name: 'Birch', xp: wc.rows[0].xp, milestones: 0 });
    // Ladders open in the same order on every page: Total first, then each skill.
    expect((await ladders(a)).ladders.map((l) => l.skill).slice(0, 2)).toEqual(['total', 'woodcutting']);
    s.ctx.db.update(players).set({ bannedAt: s.clock.now }).where(eq(players.name, 'Birch')).run();
    const after = (await ladders(a)).ladders.find((l) => l.skill === 'woodcutting')!;
    expect(after.rows.map((r) => r.name)).toEqual(['Alder']);
    expect(after.you).toMatchObject({ rank: 1 });
  });

  it("shows each player's title and banner beside their name, as their deeds open them", async () => {
    s = await server();
    const a = await signUp(s, 'Alder');
    await record(a, (st) => ({ ...st, skills: { woodcutting: { xp: XP_TABLE[99] } } }), 1);
    const before = (await ladders(a)).ladders.find((l) => l.skill === 'woodcutting')!;
    expect(before.you).toMatchObject({ title: null, banner: 'woad' });
    // A title not yet opened is refused; recording the deeds opens it.
    const choose = (n: number, kind: string, id: string) =>
      post(s, '/api/f/deeds/choose', { requestId: `req-honour-${n}`, input: { kind, id } }, a);
    expect((JSON.parse((await choose(1, 'title', 'forester')).body) as { result: unknown }).result).toEqual({
      ok: false,
      reason: 'locked',
    });
    await post(s, '/api/f/deeds/refresh', { requestId: 'req-deeds-1', input: {} }, a);
    expect((JSON.parse((await choose(2, 'title', 'forester')).body) as { result: unknown }).result).toEqual({
      ok: true,
    });
    await choose(3, 'banner', 'dawn');
    const after = (await ladders(a)).ladders.find((l) => l.skill === 'woodcutting')!;
    expect(after.rows[0]).toMatchObject({ name: 'Alder', title: 'forester', banner: 'dawn' });
  });

  it('gives a tie to whoever reached it first', async () => {
    // Written straight into saves, so the two hold exactly the same XP.
    s = await server();
    const a = await signUp(s, 'Alder');
    const b = await signUp(s, 'Birch');
    const same = (st: State): State => ({ ...st, skills: { woodcutting: { xp: 5_000 } } });
    await record(b, same, 1);
    await record(a, same, 2);
    const wc = (await ladders(a)).ladders.find((l) => l.skill === 'woodcutting')!;
    expect(wc.rows.map((r) => r.name)).toEqual(['Birch', 'Alder']);
    expect(wc.you).toMatchObject({ rank: 2 });
  });

  it('keeps up as XP rises', async () => {
    s = await server();
    const a = await signUp(s, 'Alder');
    const b = await signUp(s, 'Birch');
    await chop(a, 'a1', 10);
    await chop(b, 'b1', 30);
    await chop(a, 'a2', 30);
    const wc = (await ladders(b)).ladders.find((l) => l.skill === 'woodcutting')!;
    expect(wc.rows.map((r) => r.name)).toEqual(['Alder', 'Birch']);
    expect(wc.you).toMatchObject({ rank: 2 });
  });

  it('counts what a player gained while only watching, or away, without a write', async () => {
    s = await server();
    const a = await signUp(s, 'Alder');
    const b = await signUp(s, 'Birch');
    const idOf = async (c: string) =>
      (
        JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie: c } })).body) as {
          player: { id: string };
        }
      ).player.id;
    const start = (c: string, id: string) =>
      post(
        s,
        '/api/game/command',
        { requestId: `req-hs-${id}-watch`, command: { type: 'start', lane: 'gathering', action: pine } },
        c,
      );
    await start(a, 'a');
    await start(b, 'b');
    listAll();
    // Alder leaves a page open; Birch has gone. Neither acts for half an hour.
    s.ctx.live.add(await idOf(a), { readyState: 1, send: () => undefined, close: () => undefined });
    s.clock.now += 30 * 60_000;
    expect(await hearWatching(s.ctx)).toBe(1);
    const seen = (await ladders(b)).ladders.find((l) => l.skill === 'woodcutting')!;
    // Both are on the ladder with their half hour: Alder as the server read him, Birch as he asked.
    expect(seen.rows.map((r) => r.name).sort()).toEqual(['Alder', 'Birch']);
    expect(seen.rows.every((r) => r.level > 1)).toBe(true);
    // Heard of just now, so the next tick leaves Alder be.
    expect(await hearWatching(s.ctx)).toBe(0);
  });

  it('ranks Total by total level first, then XP', () => {
    // Written straight into saves: one broad player, one with more XP in a single skill.
    const xp = (n: number) => ({ xp: n });
    return (async () => {
      s = await server();
      const a = await signUp(s, 'Alder');
      const b = await signUp(s, 'Birch');
      await record(
        a,
        (st) => ({ ...st, skills: { woodcutting: xp(1_000), mining: xp(1_000), smithing: xp(1_000) } }),
        1,
      );
      await record(b, (st) => ({ ...st, skills: { woodcutting: xp(20_000) } }), 1);
      const total = (await ladders(a)).ladders.find((l) => l.skill === 'total')!;
      expect(total.rows.map((r) => r.name)).toEqual(['Alder', 'Birch']);
      expect(total.rows[0].xp).toBeLessThan(total.rows[1].xp);
      expect((await ladders(b)).ladders.find((l) => l.skill === 'total')!.you).toMatchObject({ rank: 2 });
    })();
  });

  it('lists a player only once one of their actions comes half an hour after their first', async () => {
    s = await server();
    const a = await signUp(s, 'Alder');
    const b = await signUp(s, 'Birch');
    // Birch plays a while; Alder looks for ten minutes and goes.
    await chop(b, 'b', 45);
    await chop(a, 'a', 10);
    const theirs = (await ladders(b)).ladders.find((l) => l.skill === 'woodcutting')!;
    expect(theirs.rows.map((r) => r.name)).toEqual(['Birch']);
    // Alder still sees his own place, where he would stand, and is told he is not yet listed.
    const his = await ladders(a);
    expect(his.listed).toBe(false);
    expect(his.ladders.find((l) => l.skill === 'woodcutting')).toMatchObject({
      rows: [{ name: 'Birch', rank: 1 }],
      you: { name: 'Alder', rank: 2 },
    });
    expect((await ladders(b)).listed).toBe(true);
    // Back the next day, one action lists him: it comes long after his first.
    s.clock.now += 24 * 3_600_000;
    await post(s, '/api/game/command', { requestId: 'req-hs-back', command: { type: 'stoke' } }, a);
    expect((await ladders(a)).listed).toBe(true);
    expect((await ladders(b)).ladders.find((l) => l.skill === 'woodcutting')!.rows.map((r) => r.name)).toEqual([
      'Birch',
      'Alder',
    ]);
  });

  it('counts a feature’s route as an action, and a request sent twice once', async () => {
    s = await server();
    const a = await signUp(s, 'Alder');
    await chop(a, 'a', 5);
    s.clock.now += 30 * 60_000;
    // The same request again does nothing a second time, so it is no new action.
    const again = await post(
      s,
      '/api/game/command',
      { requestId: 'req-hs-a-start', command: { type: 'start', lane: 'gathering', action: pine } },
      a,
    );
    expect(JSON.parse(again.body)).toMatchObject({ duplicate: true });
    expect((await ladders(a)).listed).toBe(false);
    await post(s, '/api/f/goals/refresh', { requestId: 'req-hs-goals', input: {} }, a);
    expect((await ladders(a)).listed).toBe(true);
  });
});
