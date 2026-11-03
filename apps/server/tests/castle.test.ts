// Castle Clash over HTTP (docs/castle-clash/): a castle opens at total level 100; every change acts once
// per request id, in one transaction with the save; a siege moves gold between two lords and the war
// chest and never makes any; a raid that empties a treasury switches the lord's edict off in their save;
// both lords read the siege in their reports.
import { ORDERS, XP_TABLE } from '@idle-clash/content';
import { allSkills, castleEngine as E } from '@idle-clash/features';
import { describe, expect, it, vi } from 'vitest';
import { CastleStore } from '../src/castle/store.ts';
import { code, post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
const H = 3_600_000;

interface Lord {
  cookie: string;
  id: string;
}

/** A lord of total level 11 × `level`, holding `gold`. */
async function lord(name: string, level: number, gold: number): Promise<Lord> {
  const cookie = await signUp(s, name);
  const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
    player: { id: string };
  };
  const id = me.player.id;
  const saved = s.ctx.store.read(id, s.clock.now)!;
  const skills = Object.fromEntries(allSkills().map((k) => [k, { xp: XP_TABLE[level] }]));
  const state = { ...saved.doc.state, skills, items: { ...saved.doc.state.items, gold } };
  s.ctx.store.write(id, { ...saved.doc, state }, saved.rev, s.clock.now);
  return { cookie, id };
}

let req = 0;
const act = (l: Lord, action: unknown, requestId = `req-castle-${++req}`) =>
  post(s, '/api/castle/act', { requestId, action }, l.cookie);
const result = async (l: Lord, action: unknown) =>
  (JSON.parse((await act(l, action)).body) as { result: { ok: boolean; reason?: string } & Record<string, unknown> })
    .result;
const view = async (l: Lord) =>
  JSON.parse((await s.app.inject({ method: 'GET', url: '/api/castle', headers: { cookie: l.cookie } })).body) as {
    open: boolean;
    castle: E.Castle | null;
    warChest: number;
    logs: { kind: string; foeName: string | null; data: Record<string, unknown> }[];
  };
const gold = (l: Lord) => s.ctx.store.read(l.id, s.clock.now)!.doc.state.items.gold ?? 0;
const open = (l: Lord) => post(s, '/api/castle/open', { requestId: `req-open-${++req}` }, l.cookie);
const answer = (r: { body: string }) =>
  JSON.parse(r.body) as { result: { ok: boolean; reason?: string } & Record<string, unknown>; duplicate: boolean };

/** Sets a castle's levels directly (as months of play would), past its novice shield. */
function raise(l: Lord, level: number, extra: Partial<E.Castle> = {}) {
  const castles = new CastleStore(s.ctx);
  const c = castles.read(l.id)!;
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as E.Castle['levels'];
  const raised = { ...c, levels, shieldUntil: s.clock.now - 1, activeAp: 200, ...extra };
  castles.write({ ...raised, rating: E.bastionRating(raised) });
}

describe('Castle Clash over HTTP', () => {
  it('opens a castle at total level 100 (not before), once, behind a 48-hour novice shield', async () => {
    s = await server();
    const low = await lord('Lowly', 5, 0);
    expect(answer(await open(low)).result).toEqual({ ok: false, reason: 'closed' });
    expect((await view(low)).open).toBe(false);
    const high = await lord('Highborn', 10, 0);
    expect(answer(await open(high)).result).toEqual({ ok: true, opened: true });
    expect(answer(await open(high)).result).toEqual({ ok: true, opened: false });
    const v = await view(high);
    expect(v.castle!.shieldUntil).toBe(s.clock.now + 48 * H);
    expect(v.castle!.activeAp).toBe(60);
  });

  it('answers the Call to arms once a day, and acts once per request id', async () => {
    s = await server();
    const l = await lord('Caller', 10, 0);
    await open(l);
    const first = await act(l, { type: 'callToArms' }, 'req-call-0001');
    expect(answer(first).result.ok).toBe(true);
    const again = answer(await act(l, { type: 'callToArms' }, 'req-call-0001'));
    expect(again.duplicate).toBe(true);
    expect(await result(l, { type: 'callToArms' })).toEqual({ ok: false, reason: 'claimed' });
  });

  it('moves gold between purse and treasury in one write, taxing a withdrawal 20%', async () => {
    s = await server();
    const l = await lord('Banker', 10, 1_000_000);
    await open(l);
    expect((await result(l, { type: 'deposit', gold: 400_000 })).ok).toBe(true);
    expect(gold(l)).toBe(600_000);
    expect((await view(l)).castle!.treasury).toBe(400_000);
    expect((await result(l, { type: 'withdraw', gold: 100_000 })).ok).toBe(true);
    expect(gold(l)).toBe(680_000);
    expect(await result(l, { type: 'deposit', gold: 10_000_000 })).toEqual({ ok: false, reason: 'gold' });
    expect((await view(l)).warChest).toBe(1_000);
  });

  it('writes the edict into the save, and takes it away when a raid leaves the treasury short', async () => {
    s = await server();
    const keeper = await lord('Keeper', 10, 2_000_000);
    await open(keeper);
    await result(keeper, { type: 'deposit', gold: 1_000_000 });
    await result(keeper, { type: 'edict', edict: 'vigor' });
    const mirror = () => s.ctx.store.read(keeper.id, s.clock.now)!.doc.state.features.castle as E.CastleMirror;
    expect(mirror()).toMatchObject({ edict: 'vigor' });
    expect(mirror().pct).toBeGreaterThan(5);
    // The treasury is emptied (as a raid would); the next game request rewrites the mirror.
    const castles = new CastleStore(s.ctx);
    castles.write({ ...castles.read(keeper.id)!, treasury: 0 });
    await post(s, '/api/game/command', { requestId: 'req-stoke-0001', command: { type: 'stoke' } }, keeper.cookie);
    expect(mirror()).toMatchObject({ edict: null, pct: 0, until: 0 });
  });

  it('settles a siege between two lords: both castles, both reports, the chest, and no gold made', async () => {
    s = await server();
    const att = await lord('Raider', 20, 50_000_000);
    const def = await lord('Holder', 20, 50_000_000);
    await open(att);
    await open(def);
    raise(att, 40);
    raise(def, 20, { treasury: 30_000_000 });
    const castles = new CastleStore(s.ctx);
    const total = () => gold(att) + gold(def) + castles.read(att.id)!.treasury + castles.read(def.id)!.treasury;
    const before = total();
    const r = await result(att, { type: 'siege', target: def.id });
    expect(r.ok).toBe(true);
    expect(r.outcome).not.toBe('repelled');
    const chest = (await view(att)).warChest;
    const destroyed = s.ctx.store.sqlite.prepare('select gold_destroyed g from bastion_global_state').get() as {
      g: number;
    };
    // Every gold piece is accounted for: held by a lord, in the chest, or destroyed.
    expect(total() + chest + destroyed.g).toBe(before);
    expect((await view(att)).logs[0]).toMatchObject({ kind: 'siegeOut', foeName: 'Holder' });
    expect((await view(def)).logs[0]).toMatchObject({ kind: 'siegeIn', foeName: 'Raider' });
    expect(await result(att, { type: 'siege', target: def.id })).toMatchObject({ ok: true });
    expect(await result(att, { type: 'siege', target: def.id })).toEqual({ ok: false, reason: 'pairLimit' });
  });

  it('offers a lord who besieged you to strike back, and tells each battle how it went (session 38)', async () => {
    s = await server();
    const att = await lord('Reaver', 20, 50_000_000);
    const def = await lord('Warden', 20, 50_000_000);
    await open(att);
    await open(def);
    // Far apart in rating, so the attacker is not among the defender's lords near their rating.
    raise(att, 40);
    raise(def, 10, { treasury: 30_000_000 });
    const targets = async (l: Lord) =>
      JSON.parse(
        (await s.app.inject({ method: 'GET', url: '/api/castle/targets', headers: { cookie: l.cookie } })).body,
      ) as E.CastleTargets;
    expect((await targets(def)).lords.find((x) => x.id === att.id)).toBeUndefined();
    expect(await result(att, { type: 'siege', target: def.id })).toMatchObject({ ok: true });
    const foe = (await targets(def)).lords.find((x) => x.id === att.id);
    expect(foe).toMatchObject({ name: 'Reaver', struck: s.clock.now, shieldedUntil: null });
    // Both reports carry the battle's account; the defender also sees the formation that came at them.
    const out = (await view(att)).logs[0].data;
    const inn = (await view(def)).logs[0].data;
    for (const d of [out, inn]) {
      expect(Number(d.attack)).toBeGreaterThan(0);
      expect(Number(d.defense)).toBeGreaterThan(0);
      expect(Math.abs(Number(d.fortune))).toBeLessThanOrEqual(0.1);
    }
    expect(inn.formation).toEqual([34, 33, 33]);
    // A day later the foe is no longer offered.
    s.clock.now += 25 * H;
    expect((await targets(def)).lords.find((x) => x.id === att.id)).toBeUndefined();
  });

  it("offers the day's five strongholds beside any lords, and refuses one that has fallen", async () => {
    s = await server();
    const att = await lord('Freebooter', 20, 50_000_000);
    await open(att);
    raise(att, 30, { activeAp: 1000 });
    const list = JSON.parse(
      (await s.app.inject({ method: 'GET', url: '/api/castle/targets', headers: { cookie: att.cookie } })).body,
    ) as E.CastleTargets;
    expect(list.mercenaries.map((m) => m.n)).toEqual([0, 1, 2, 3, 4]);
    const easy = list.mercenaries[0];
    const rolls = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const r = await result(att, { type: 'siege', target: easy.id }).finally(() => rolls.mockRestore());
    expect(r).toMatchObject({ ok: true });
    expect(r.outcome).not.toBe('repelled');
    expect(await result(att, { type: 'siege', target: easy.id })).toEqual({ ok: false, reason: 'fallen' });
  });

  it('opens the war on the first day: strongholds and incursions, the novice shield kept (session 40)', async () => {
    s = await server();
    const l = await lord('Fresh', 10, 50_000_000);
    await open(l);
    const shield = (await view(l)).castle!.shieldUntil;
    const list = JSON.parse(
      (await s.app.inject({ method: 'GET', url: '/api/castle/targets', headers: { cookie: l.cookie } })).body,
    ) as E.CastleTargets;
    expect(list.mercenaries).toHaveLength(5);
    expect((await result(l, { type: 'siege', target: list.mercenaries[0].id })).ok).toBe(true);
    expect((await result(l, { type: 'incursion' })).ok).toBe(true);
    expect((await view(l)).castle!.shieldUntil).toBe(shield);
    // A formation sent with an attack must be whole.
    expect(await result(l, { type: 'siege', target: list.mercenaries[1].id, shares: [50, 50, 50] })).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('pays the orders of the day as they are done (session 40)', async () => {
    s = await server();
    const l = await lord('Dutiful', 20, 500_000_000);
    await open(l);
    raise(l, 30, { activeAp: 2000 });
    const orders = () => E.ordersOf(E.syncCastle(new CastleStore(s.ctx).read(l.id)!, s.clock.now).castle, s.clock.now);
    const first = orders();
    expect(first.list[0].kind).toBe('strongholds');
    const list = JSON.parse(
      (await s.app.inject({ method: 'GET', url: '/api/castle/targets', headers: { cookie: l.cookie } })).body,
    ) as E.CastleTargets;
    const rolls = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const before = (await view(l)).castle!.warMarks;
    // The easiest first, until the order is done or one holds.
    let taken = 0;
    try {
      for (const m of list.mercenaries) {
        if (taken >= first.list[0].target) break;
        const best = E.bestOffense(
          E.syncCastle(new CastleStore(s.ctx).read(l.id)!, s.clock.now).castle,
          E.mercenarySide(m),
          s.clock.now,
        );
        const r = answer(await act(l, { type: 'siege', target: m.id, shares: [...best.shares] })).result;
        expect(r.ok).toBe(true);
        if (r.outcome !== 'repelled') taken++;
      }
    } finally {
      rolls.mockRestore();
    }
    expect(taken).toBe(first.list[0].target);
    expect(orders().list[0].progress).toBe(first.list[0].target);
    const won = (await view(l)).logs
      .filter((x) => x.kind === 'mercenary')
      .reduce((n, x) => n + Number(x.data.marks), 0);
    expect((await view(l)).castle!.warMarks - before).toBe(won + ORDERS.MARKS);
  });

  it('refuses a shielded lord, an unknown one, yourself, and the war room before an average level of 5', async () => {
    s = await server();
    const att = await lord('Eager', 20, 50_000_000);
    const def = await lord('Novice', 20, 0);
    await open(att);
    await open(def);
    expect(await result(att, { type: 'siege', target: def.id })).toEqual({ ok: false, reason: 'locked' });
    raise(att, 10);
    expect(await result(att, { type: 'siege', target: def.id })).toEqual({ ok: false, reason: 'shielded' });
    expect(await result(att, { type: 'siege', target: att.id })).toEqual({ ok: false, reason: 'self' });
    expect(await result(att, { type: 'siege', target: '00000000-0000-4000-8000-000000000000' })).toEqual({
      ok: false,
      reason: 'unknown',
    });
  });

  it('pays a mercenary bounty only from the war chest', async () => {
    s = await server();
    const att = await lord('Sellsword', 20, 50_000_000);
    await open(att);
    raise(att, 30);
    const target = (
      JSON.parse(
        (await s.app.inject({ method: 'GET', url: '/api/castle/targets', headers: { cookie: att.cookie } })).body,
      ) as {
        mercenaries: E.Mercenary[];
      }
    ).mercenaries[0];
    const r = await result(att, { type: 'siege', target: target.id });
    expect(r.ok).toBe(true);
    // The chest held only this siege's own fee share: the bounty, if any, came out of it.
    expect((await view(att)).warChest).toBeGreaterThanOrEqual(0);
    expect(Number(r.gold)).toBeLessThan(Number(r.fee));
  });

  it('lets a caught spy pay the defender war marks and tell them, and nobody else', async () => {
    s = await server();
    const att = await lord('Snoop', 20, 50_000_000);
    const def = await lord('Watcher', 20, 0);
    await open(att);
    await open(def);
    raise(att, 6, {
      levels: {
        ...E.newCastle('x', 0).levels,
        spyGuild: 1,
        walls: 6,
        deepVault: 6,
        watchtower: 6,
        vanguard: 6,
        outriders: 6,
        siege: 6,
      },
    });
    raise(def, 6, { levels: { ...E.newCastle('x', 0).levels, watchtower: 100 } });
    // A spy's chance never passes 90%, so a roll of 0.95 is caught whatever the castles (the server rolls
    // with Math.random: a fair roll needs no seed, and a test pins it).
    const rolls = vi.spyOn(Math, 'random').mockReturnValue(0.95);
    const r = await result(att, { type: 'spy', target: def.id, mission: 'scout' }).finally(() => rolls.mockRestore());
    expect(r).toMatchObject({ ok: true, success: false });
    const seen = await view(def);
    expect(seen.logs[0]).toMatchObject({ kind: 'spyIn', foeName: 'Snoop' });
    // Two war marks, or more in a week whose decree lifts them.
    expect(seen.castle!.warMarks).toBe(seen.logs[0].data.marks);
    expect(seen.castle!.warMarks).toBeGreaterThanOrEqual(2);
    expect((await view(att)).logs[0]).toMatchObject({ kind: 'spyOut', data: { success: false } });
  });
});

describe('Castle Clash and the rest of the game', () => {
  it('leaves a lord without a castle with no mirror in their save', async () => {
    s = await server();
    const l = await lord('Plain', 10, 0);
    await post(s, '/api/game/command', { requestId: 'req-stoke-0002', command: { type: 'stoke' } }, l.cookie);
    expect(s.ctx.store.read(l.id, s.clock.now)!.doc.state.features.castle).toBeUndefined();
    expect(
      code(await post(s, '/api/castle/act', { requestId: 'req-x-00000001', action: { type: 'excavate' } }, l.cookie)),
    ).toBeUndefined();
  });
});
