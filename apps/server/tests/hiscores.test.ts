// Hiscores: kept as saves change; ranked by XP, ties to whoever got there first; your own entry
// wherever it is; banned players left out; and how many are online.
import type { HiscoresResponse } from '@idle-clash/contracts';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { players } from '../src/db/schema.ts';
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
  // A stoke writes the time spent, which is when the hiscores hear of it.
  await post(s, '/api/game/command', { requestId: `req-hs-${id}-stoke`, command: { type: 'stoke' } }, cookie);
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
    await chop(a, 'a', 10);
    await chop(b, 'b', 30);
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

  it('gives a tie to whoever reached it first', async () => {
    // Recorded straight from saves, so the two hold exactly the same XP.
    s = await server();
    const a = await signUp(s, 'Alder');
    const b = await signUp(s, 'Birch');
    const id = async (c: string) =>
      (
        JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie: c } })).body) as {
          player: { id: string };
        }
      ).player.id;
    const base = s.ctx.store.read(await id(a), s.clock.now)!.doc.state;
    const same = { ...base, skills: { woodcutting: { xp: 5_000 } } };
    s.ctx.hiscores.update(await id(b), same, 1);
    s.ctx.hiscores.update(await id(a), same, 2);
    const wc = (await ladders(a)).ladders.find((l) => l.skill === 'woodcutting')!;
    expect(wc.rows.map((r) => r.name)).toEqual(['Birch', 'Alder']);
    expect(wc.you).toMatchObject({ rank: 2 });
  });

  it('keeps up as XP rises', async () => {
    s = await server();
    const a = await signUp(s, 'Alder');
    const b = await signUp(s, 'Birch');
    await chop(a, 'a1', 10);
    await chop(b, 'b1', 20);
    await chop(a, 'a2', 30);
    const wc = (await ladders(b)).ladders.find((l) => l.skill === 'woodcutting')!;
    expect(wc.rows.map((r) => r.name)).toEqual(['Alder', 'Birch']);
    expect(wc.you).toMatchObject({ rank: 2 });
  });

  it('ranks Total by total level first, then XP', () => {
    // Recorded straight from saves: one broad player, one with more XP in a single skill.
    const xp = (n: number) => ({ xp: n });
    return (async () => {
      s = await server();
      const a = await signUp(s, 'Alder');
      const b = await signUp(s, 'Birch');
      const id = async (c: string) =>
        (
          JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie: c } })).body) as {
            player: { id: string };
          }
        ).player.id;
      const base = s.ctx.store.read(await id(a), s.clock.now)!.doc.state;
      s.ctx.hiscores.update(
        await id(a),
        { ...base, skills: { woodcutting: xp(1_000), mining: xp(1_000), smithing: xp(1_000) } },
        1,
      );
      s.ctx.hiscores.update(await id(b), { ...base, skills: { woodcutting: xp(20_000) } }, 1);
      const total = (await ladders(a)).ladders.find((l) => l.skill === 'total')!;
      expect(total.rows.map((r) => r.name)).toEqual(['Alder', 'Birch']);
      expect(total.rows[0].xp).toBeLessThan(total.rows[1].xp);
      expect((await ladders(b)).ladders.find((l) => l.skill === 'total')!.you).toMatchObject({ rank: 2 });
    })();
  });
});
