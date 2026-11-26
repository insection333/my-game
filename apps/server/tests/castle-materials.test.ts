// The castle raised from the land (session 247): Castle Clash took gold alone, so a player's own logs, ore,
// bars and runes never mattered to it. Asked, a building's Level up pays up to a quarter of its gold in the material
// the building takes, each at its price; the rest is gold, and no gold is made.
import { XP_TABLE } from '@idle-clash/content';
import { allSkills, castleEngine as E, materialFor, materialsFor } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { CastleStore } from '../src/castle/store.ts';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
let req = 0;

async function lord(items: Record<string, number>) {
  const cookie = await signUp(s, 'Mason');
  const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
    player: { id: string };
  };
  const id = me.player.id;
  const saved = s.ctx.store.read(id, s.clock.now)!;
  const skills = Object.fromEntries(allSkills().map((k) => [k, { xp: XP_TABLE[50] }]));
  s.ctx.store.write(id, { ...saved.doc, state: { ...saved.doc.state, skills, items } }, saved.rev, s.clock.now);
  const opened = await post(s, '/api/castle/open', { requestId: `req-open-${++req}` }, cookie);
  if (opened.statusCode !== 200) throw new Error(opened.body);
  const castles = new CastleStore(s.ctx);
  const c = castles.read(id)!;
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, 10])) as E.Castle['levels'];
  castles.write({ ...c, levels, payFromTreasury: false, rating: E.bastionRating({ ...c, levels }) });
  return { cookie, id, castles };
}
const act = (cookie: string, action: unknown) =>
  post(s, '/api/castle/act', { requestId: `req-castle-mat-${++req}`, action }, cookie).then(
    (r) => (JSON.parse(r.body) as { result: { ok: boolean; reason?: string } }).result,
  );
const save = (id: string) => s.ctx.store.read(id, s.clock.now)!.doc.state;

describe('a Level up paid in materials', () => {
  it('takes up to a quarter of its gold in the material, each at its price', async () => {
    s = await server();
    const me = await lord({ gold: 50_000_000, 'maple-logs': 100_000 });
    expect(materialFor(save(me.id), 'watchtower')).toBe('maple-logs');
    const c = me.castles.read(me.id)!;
    const cost = E.levelUpCost(c, 'watchtower', 1, s.clock.now);
    const paid = materialsFor(save(me.id), 'watchtower', cost)!;
    expect(paid.credit).toBe(Math.floor(cost / 4));
    expect(paid.count).toBe(Math.ceil(Math.floor(cost / 4) / 70));
    expect(await act(me.cookie, { type: 'upgrade', id: 'watchtower', materials: true })).toEqual({ ok: true });
    const after = save(me.id);
    expect(after.items.gold).toBe(50_000_000 - (cost - paid.credit));
    expect(after.items['maple-logs']).toBe(100_000 - paid.count);
    expect(me.castles.read(me.id)!.levels.watchtower).toBe(11);
  });

  it('pays the rest in gold when too few are held, and all in gold when not asked', async () => {
    s = await server();
    const me = await lord({ gold: 50_000_000, 'maple-logs': 10 });
    const c = me.castles.read(me.id)!;
    const cost = E.levelUpCost(c, 'watchtower', 1, s.clock.now);
    expect(await act(me.cookie, { type: 'upgrade', id: 'watchtower', materials: true })).toEqual({ ok: true });
    expect(save(me.id).items.gold).toBe(50_000_000 - (cost - Math.floor(10 * 70)));
    expect(save(me.id).items['maple-logs'] ?? 0).toBe(0);
    const next = E.levelUpCost(me.castles.read(me.id)!, 'watchtower', 1, s.clock.now);
    const before = save(me.id).items.gold;
    expect(await act(me.cookie, { type: 'upgrade', id: 'watchtower' })).toEqual({ ok: true });
    expect(save(me.id).items.gold).toBe(before - next);
  });

  it("leaves a troop's Level up to gold alone: their levels set the evolutions' pace", async () => {
    s = await server();
    const me = await lord({ gold: 50_000_000, 'maple-logs': 100_000, 'moonsilver-bar': 100_000 });
    const cost = E.levelUpCost(me.castles.read(me.id)!, 'siege', 1, s.clock.now);
    expect(await act(me.cookie, { type: 'upgrade', id: 'siege', materials: true })).toEqual({ ok: true });
    expect(save(me.id).items.gold).toBe(50_000_000 - cost);
    expect([save(me.id).items['maple-logs'], save(me.id).items['moonsilver-bar']]).toEqual([100_000, 100_000]);
  });

  it('takes nothing when the gold left is short, and the engine refuses more than a quarter', async () => {
    s = await server();
    const me = await lord({ gold: 10, 'moonsilver-bar': 100_000 });
    expect((await act(me.cookie, { type: 'upgrade', id: 'deepVault', materials: true })).ok).toBe(false);
    expect(save(me.id).items['moonsilver-bar']).toBe(100_000);
    const c = me.castles.read(me.id)!;
    const cost = E.levelUpCost(c, 'vanguard', 1, s.clock.now);
    const w = { castle: c, purse: 1e12 };
    expect(E.upgrade(w, 'vanguard', s.clock.now, 1, Math.floor(cost / 4) + 1)).toMatchObject({ ok: false });
    expect(E.upgrade(w, 'vanguard', s.clock.now, 1, -1)).toMatchObject({ ok: false });
  });
});

describe('a charter over HTTP (session 249)', () => {
  it('is kept on the castle and mirrored into the save', async () => {
    s = await server();
    const me = await lord({ gold: 1_000_000 });
    const c = me.castles.read(me.id)!;
    me.castles.write({ ...c, warMarks: 200, warMarksEarned: 1_000 });
    expect(await act(me.cookie, { type: 'charter', charter: 'arms' })).toEqual({ ok: true });
    expect(me.castles.read(me.id)!.charters).toEqual({ land: 0, craft: 0, arms: 1 });
    expect(me.castles.read(me.id)!.warMarks).toBe(140);
    expect((save(me.id).features.castle as { charters?: unknown }).charters).toEqual({ land: 0, craft: 0, arms: 1 });
  });
});
