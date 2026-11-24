// A player's record and an admin's powers over it (session 229): the record reads who they are, what they
// hold and do and what admins did; gold and items given and taken (never below nothing), XP given, every
// browser signed out, and the account deleted only with its name typed as it is; each in the Audit log
// with its reason, and the player's own save changed as their requests change it.
import { afterEach, describe, expect, it } from 'vitest';
import { code, ORIGIN, post, server, signUp, type TestServer } from './helpers.ts';

const SECRET = 'console secret 1';
let s: TestServer;
afterEach(() => s?.close());

const call = (cookie: string, url: string, body: unknown) => post(s, url, body, cookie, { origin: ORIGIN });
const json = async <T>(cookie: string, url: string, body: unknown): Promise<T> => {
  const r = await call(cookie, url, body);
  if (r.statusCode >= 300) throw new Error(`${url}: ${r.statusCode} ${r.body}`);
  return JSON.parse(r.body) as T;
};
const setup = async () => {
  s = await server({ staff: { name: 'Admin', password: SECRET } });
  const rowan = await signUp(s, 'Rowan');
  const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie: rowan } })).body) as {
    player: { id: string };
  };
  const r = await post(s, '/api/auth/sign-in', { name: 'Admin', password: SECRET }, undefined, { origin: ORIGIN });
  return { rowan, id: me.player.id, admin: String(r.headers['set-cookie']).split(';')[0] };
};
const itemsOf = (id: string) => s.ctx.store.read(id, s.clock.now)!.doc.state.items;

describe("a player's record and the admin's powers", () => {
  it('reads the record: standing, skills, lanes, castle, history, and what can be given', async () => {
    const { id, admin } = await setup();
    const r = await json<{
      name: string;
      sessions: number;
      skills: { skill: string; level: number }[];
      lanes: { lane: string }[];
      catalog: { id: string; name: string }[];
    }>(admin, '/api/admin/record', { playerId: id });
    expect(r).toMatchObject({ name: 'Rowan', sessions: 1 });
    expect(r.skills.find((x) => x.skill === 'woodcutting')).toMatchObject({ level: 1 });
    expect(r.lanes.map((l) => l.lane)).toContain('Gathering');
    expect(r.catalog[0]).toEqual({ id: 'gold', name: 'Gold' });
  });

  it('gives and takes, never below nothing, each logged with its reason', async () => {
    const { id, admin } = await setup();
    const gave = await json(admin, '/api/admin/grant', {
      playerId: id,
      item: 'oak-logs',
      count: 250,
      reason: 'Lost to a fault',
    });
    expect(gave).toEqual({ ok: true, held: 250 });
    expect(itemsOf(id)['oak-logs']).toBe(250);
    expect(
      await json(admin, '/api/admin/grant', { playerId: id, item: 'oak-logs', count: -300, reason: 'Too many' }),
    ).toEqual({
      ok: false,
      reason: 'notEnough',
    });
    expect(
      await json(admin, '/api/admin/grant', { playerId: id, item: 'oak-logs', count: -50, reason: 'Too many' }),
    ).toEqual({
      ok: true,
      held: 200,
    });
    expect(
      await json(admin, '/api/admin/grant', { playerId: id, item: 'no-such-thing', count: 1, reason: 'A test' }),
    ).toEqual({
      ok: false,
      reason: 'unknown',
    });
    // A reason is asked for.
    expect(code(await call(admin, '/api/admin/grant', { playerId: id, item: 'gold', count: 5, reason: '' }))).toBe(
      'invalidInput',
    );
    const xp = await json<{ ok: boolean; level: number }>(admin, '/api/admin/xp', {
      playerId: id,
      skill: 'mining',
      xp: 1_000_000,
      reason: 'Lost to a fault',
    });
    expect(xp).toMatchObject({ ok: true, level: 28 });
    const log = await json<{ entries: { action: string; detail: Record<string, unknown> }[] }>(
      admin,
      '/api/admin/audit',
      {
        query: '',
        before: null,
      },
    );
    expect(log.entries.map((e) => e.action)).toEqual(['xp', 'take', 'give']);
    expect(log.entries[2].detail).toEqual({ item: 'Oak logs', count: 250, reason: 'Lost to a fault' });
  });

  it('signs a player out everywhere, and deletes an account only with its name typed as it is', async () => {
    const { rowan, id, admin } = await setup();
    expect((await call(admin, '/api/admin/sign-out', { playerId: id })).statusCode).toBe(204);
    const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie: rowan } })).body) as {
      player: unknown;
    };
    expect(me.player).toBeNull();
    expect(code(await call(admin, '/api/admin/delete', { playerId: id, name: 'rowan' }))).toBe('invalidInput');
    expect((await call(admin, '/api/admin/delete', { playerId: id, name: 'Rowan' })).statusCode).toBe(204);
    expect(s.ctx.store.read(id, s.clock.now)).toBeNull();
    expect(code(await call(admin, '/api/admin/record', { playerId: id }))).toBe('notFound');
  });

  it('is for admins only', async () => {
    const { rowan, id } = await setup();
    expect(
      code(await call(rowan, '/api/admin/grant', { playerId: id, item: 'gold', count: 5, reason: 'For me' })),
    ).toBe('notAdmin');
  });
});
