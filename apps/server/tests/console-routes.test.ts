// The console's overview, directory and audit log (session 228): counts of players that leave out the
// console's own account, a directory that finds, filters, sorts and pages, and a log of every admin action
// that keeps nothing of a deleted player.
import { afterEach, describe, expect, it } from 'vitest';
import { code, ORIGIN, post, server, signUp, signUpAdmin, type TestServer } from './helpers.ts';

const SECRET = 'console secret 1';
const DAY = 86_400_000;
let s: TestServer;
afterEach(() => s?.close());

const as = async <T>(cookie: string, url: string, body: unknown = ''): Promise<T> => {
  const r = await post(s, url, body, cookie, { origin: ORIGIN });
  if (r.statusCode >= 300) throw new Error(`${url}: ${r.statusCode} ${r.body}`);
  return (r.body ? JSON.parse(r.body) : null) as T;
};
const staffIn = async () => {
  const r = await post(s, '/api/auth/sign-in', { name: 'Admin', password: SECRET }, undefined, { origin: ORIGIN });
  return String(r.headers['set-cookie']).split(';')[0];
};
const idOf = async (cookie: string) =>
  (
    JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
      player: { id: string };
    }
  ).player.id;
const visit = (cookie: string) => s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie } });

describe("the console's overview", () => {
  it('counts the players, never the console, and what waits for moderation', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const old = await signUp(s, 'Alder');
    await visit(old);
    s.clock.now += 3 * DAY;
    const rowan = await signUp(s, 'Rowan');
    const birch = await signUp(s, 'Birch');
    await visit(rowan);
    await post(s, '/api/report', { name: 'Birch', reason: 'name' }, rowan, { origin: ORIGIN });
    const admin = await staffIn();
    await as(admin, '/api/admin/ban', { playerId: await idOf(birch), banned: true });
    const o = await as<{
      players: Record<string, number>;
      moderation: Record<string, number>;
      days: { signUps: number; active: number }[];
      retention: { day2: number | null; day2Of: number };
      server: { saves: number };
    }>(admin, '/api/admin/overview');
    expect(o.players).toMatchObject({ total: 3, newToday: 2, newWeek: 3, activeToday: 1, activeWeek: 2, banned: 1 });
    expect(o.moderation).toMatchObject({ openReports: 0, reported: 0 });
    expect(o.days).toHaveLength(14);
    expect(o.days.at(-1)).toEqual(expect.objectContaining({ signUps: 2, active: 1 }));
    // Alder joined three days ago and has not been back on their second day.
    expect(o.retention).toMatchObject({ day2: 0, day2Of: 1 });
    expect(o.server.saves).toBe(3);
  });

  it('is for admins only', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const rowan = await signUp(s, 'Rowan');
    expect(code(await post(s, '/api/admin/overview', '', rowan, { origin: ORIGIN }))).toBe('notAdmin');
    const warden = await signUpAdmin(s, 'Warden');
    expect((await post(s, '/api/admin/overview', '', warden, { origin: ORIGIN })).statusCode).toBe(200);
  });
});

describe("the console's directory", () => {
  it('finds, filters, sorts and pages the players', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    for (const name of ['Alder', 'Birch', 'Cedar', 'Hazel']) {
      await signUp(s, name);
      s.clock.now += 60_000;
    }
    const hazel = await signUp(s, 'Hazelnut');
    await post(s, '/api/report', { name: 'Birch', reason: 'cheating' }, hazel, { origin: ORIGIN });
    const admin = await staffIn();
    const dir = (body: object) =>
      as<{ rows: { name: string; openReports: number }[]; total: number }>(admin, '/api/admin/directory', {
        query: '',
        filter: 'all',
        sort: 'name',
        page: 0,
        ...body,
      });
    expect((await dir({})).rows.map((r) => r.name)).toEqual(['Alder', 'Birch', 'Cedar', 'Hazel', 'Hazelnut']);
    expect((await dir({ query: 'hAz' })).total).toBe(2);
    expect((await dir({ filter: 'reported' })).rows).toEqual([
      expect.objectContaining({ name: 'Birch', openReports: 1 }),
    ]);
    expect((await dir({ sort: 'joined' })).rows[0].name).toBe('Hazelnut');
    expect((await dir({ page: 1 })).rows).toEqual([]);
  });
});

describe("the console's audit log", () => {
  it('records every admin action by whom and to whom, and keeps nothing of a deleted player', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const rowan = await signUp(s, 'Rowan');
    const id = await idOf(rowan);
    const admin = await staffIn();
    await as(admin, '/api/admin/rename', { playerId: id, name: 'Rowanberry' });
    await as(admin, '/api/admin/ban', { playerId: id, banned: true });
    const log = await as<{ entries: { actor: string; action: string; target: string; detail: unknown }[] }>(
      admin,
      '/api/admin/audit',
      { query: '', before: null },
    );
    expect(log.entries.map((e) => [e.actor, e.action, e.target])).toEqual([
      ['Admin', 'ban', 'Rowanberry'],
      ['Admin', 'rename', 'Rowanberry'],
    ]);
    expect(log.entries[1].detail).toEqual({ from: 'Rowan', to: 'Rowanberry' });
    expect(
      (await as<{ entries: unknown[] }>(admin, '/api/admin/audit', { query: 'renam', before: null })).entries,
    ).toHaveLength(1);
    const { erase } = await import('../src/auth/account.ts');
    erase(s.ctx, id);
    expect((await as<{ entries: unknown[] }>(admin, '/api/admin/audit', { query: '', before: null })).entries).toEqual(
      [],
    );
  });
});
