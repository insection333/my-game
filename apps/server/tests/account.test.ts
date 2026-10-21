// Accounts in session 9: deleting one leaves nothing behind; names that offend or pass for the game
// are refused; and the admin page renames, bans, inspects a save and resets a forgotten password.
import type { AdminPlayersResponse, AdminResetResponse, AdminSaveResponse } from '@idle-clash/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { code, post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const PASSWORD = 'a long enough secret';
const pine = { feature: 'woodcutting', id: 'pine-tree' };
const meOf = async (cookie: string) =>
  JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
    player: { id: string; name: string } | null;
    admin: boolean;
  };
const signIn = (name: string, password: string) => post(s, '/api/auth/sign-in', { name, password });

/** Every row of every table, as text: what the database holds. */
const everything = () => {
  const tables = s.ctx.store.sqlite.prepare("select name from sqlite_master where type = 'table'").all() as {
    name: string;
  }[];
  return tables.map((t) => JSON.stringify(s.ctx.store.sqlite.prepare(`select * from "${t.name}"`).all())).join('\n');
};

describe('deleting an account', () => {
  it('leaves nothing behind: no row anywhere names the player or their id', async () => {
    s = await server();
    const cookie = await signUp(s, 'Zephyrine', PASSWORD);
    const keep = await signUp(s, 'Bystander');
    const { player } = await meOf(cookie);
    await post(
      s,
      '/api/game/command',
      { requestId: 'req-del-start', command: { type: 'start', lane: 'gathering', action: pine } },
      cookie,
    );
    s.clock.now += 3_600_000;
    await post(s, '/api/game/command', { requestId: 'req-del-stoke', command: { type: 'stoke' } }, cookie);
    const before = everything();
    expect(before).toContain(player!.id);
    expect(before).toContain('Zephyrine');
    expect(code(await post(s, '/api/account/delete', { password: 'not the password', confirm: true }, cookie))).toBe(
      'wrongPassword',
    );
    expect(everything()).toContain(player!.id);
    const r = await post(s, '/api/account/delete', { password: PASSWORD, confirm: true }, cookie);
    expect(r.statusCode).toBe(204);
    const after = everything();
    expect(after).not.toContain(player!.id);
    expect(after).not.toContain('Zephyrine');
    expect(after).not.toContain('zephyrine');
    expect((await meOf(cookie)).player).toBeNull();
    expect(code(await signIn('Zephyrine', PASSWORD))).toBe('wrongNameOrPassword');
    expect((await meOf(keep)).player).toMatchObject({ name: 'Bystander' });
  });
});

describe('names', () => {
  it('refuses names that offend or pass for the game, and not ordinary ones', async () => {
    s = await server();
    const try_ = async (name: string) =>
      (
        await post(s, '/api/auth/sign-up', { name, password: PASSWORD, ageConfirmed: true }, undefined, {
          'x-forwarded-for': `10.9.0.${name.length}`,
        })
      ).statusCode;
    for (const bad of ['Admin', 'Moderator', 'Sh1thead', 'f u c k', 'Big_Dick']) expect(await try_(bad)).toBe(422);
    for (const fine of ['Cockburn', 'Scunthorpe', 'Dickens', 'Assam']) expect(await try_(fine)).toBe(201);
  });
});

describe('the admin page', () => {
  it('is for the named admins only', async () => {
    s = await server();
    const player = await signUp(s, 'Rowan');
    const warden = await signUp(s, 'Warden');
    expect((await meOf(player)).admin).toBe(false);
    expect((await meOf(warden)).admin).toBe(true);
    expect(code(await post(s, '/api/admin/players', { query: '' }, player))).toBe('notAdmin');
    expect(code(await post(s, '/api/admin/players', { query: '' }))).toBe('notSignedIn');
  });

  it('finds a player, renames them, inspects their save, bans and unbans them', async () => {
    s = await server();
    const rowan = await signUp(s, 'Rowan');
    const warden = await signUp(s, 'Warden');
    const found = JSON.parse(
      (await post(s, '/api/admin/players', { query: 'row' }, warden)).body,
    ) as AdminPlayersResponse;
    expect(found.players.map((p) => p.name)).toEqual(['Rowan']);
    const id = found.players[0].id;
    expect(code(await post(s, '/api/admin/rename', { playerId: id, name: 'warden' }, warden))).toBe('nameTaken');
    await post(s, '/api/admin/rename', { playerId: id, name: 'Rowena' }, warden);
    expect((await meOf(rowan)).player).toMatchObject({ name: 'Rowena' });
    const save = JSON.parse((await post(s, '/api/admin/save', { playerId: id }, warden)).body) as AdminSaveResponse;
    expect(save).toMatchObject({ player: { name: 'Rowena', bannedAt: null }, repairs: [] });
    expect((save.doc as { state: { seed: number } }).state.seed).toEqual(expect.any(Number));
    await post(s, '/api/admin/ban', { playerId: id, banned: true }, warden);
    expect((await meOf(rowan)).player).toBeNull();
    expect(code(await signIn('Rowena', PASSWORD))).toBe('banned');
    await post(s, '/api/admin/ban', { playerId: id, banned: false }, warden);
    expect((await signIn('Rowena', PASSWORD)).statusCode).toBe(200);
  });

  it('resets a forgotten password: the new one works, the old one and old sessions do not', async () => {
    s = await server();
    const rowan = await signUp(s, 'Rowan');
    const warden = await signUp(s, 'Warden');
    const { player } = await meOf(rowan);
    const r = await post(s, '/api/admin/reset-password', { playerId: player!.id }, warden);
    const { password } = JSON.parse(r.body) as AdminResetResponse;
    expect(password).toMatch(/^[a-z2-9]{16}$/);
    expect((await meOf(rowan)).player).toBeNull();
    expect(code(await signIn('Rowan', PASSWORD))).toBe('wrongNameOrPassword');
    expect((await signIn('Rowan', password)).statusCode).toBe(200);
  });
});
