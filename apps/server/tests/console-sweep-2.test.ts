// The console's second sweep (session 236): the directory's rows kept for half a minute and shared, yet a ban
// shows at once and a file's pages come from one moment; a double press puts one banner up; a banner whose
// time has run out is let go.
import type { AdminOverviewResponse, AuditResponse, Banner, DirectoryResponse } from '@idle-clash/contracts';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { players, serverSettings, visits } from '../src/db/schema.ts';
import { ORIGIN, post, server, signUp, type TestServer } from './helpers.ts';

const SECRET = 'console secret 1';
let s: TestServer;
afterEach(() => s?.close());

const call = (cookie: string, url: string, body: unknown) => post(s, url, body, cookie, { origin: ORIGIN });
const json = async <T>(cookie: string, url: string, body: unknown): Promise<T> => {
  const r = await call(cookie, url, body);
  if (r.statusCode >= 300) throw new Error(`${url}: ${r.statusCode} ${r.body}`);
  return JSON.parse(r.body) as T;
};
const staffIn = async () => {
  const r = await post(s, '/api/auth/sign-in', { name: 'Admin', password: SECRET }, undefined, { origin: ORIGIN });
  return String(r.headers['set-cookie']).split(';')[0];
};
const idOf = (name: string) => s.ctx.db.select().from(players).where(eq(players.name, name)).get()!.id;
const ask = (filter: string, page = 0, file?: true) => ({
  query: '',
  filter,
  sort: 'joined',
  page,
  ...(file && { file }),
});

describe("the console's second sweep", () => {
  it('shows a ban in the directory at once, though its rows are kept', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    await signUp(s, 'Rowan');
    const admin = await staffIn();
    expect((await json<DirectoryResponse>(admin, '/api/admin/directory', ask('banned'))).total).toBe(0);
    await json(admin, '/api/admin/ban', { playerId: idOf('Rowan'), banned: true });
    const banned = await json<DirectoryResponse>(admin, '/api/admin/directory', ask('banned'));
    expect(banned.rows.map((r) => r.name)).toEqual(['Rowan']);
  });

  it("reads a file's pages from one moment, a player joining between them neither doubled nor lost", async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    for (let i = 0; i < 1002; i++) {
      s.clock.now += 1_000;
      s.ctx.db
        .insert(players)
        .values({
          id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
          name: `Player${i}`,
          nameKey: `player${i}`,
          nameLook: `player${i}`,
          passwordHash: 'x',
          createdAt: s.clock.now,
        })
        .run();
    }
    const admin = await staffIn();
    const first = await json<DirectoryResponse>(admin, '/api/admin/directory', ask('all', 0, true));
    s.clock.now += 1_000;
    await signUp(s, 'Latecomer');
    const second = await json<DirectoryResponse>(admin, '/api/admin/directory', ask('all', 1, true));
    const names = [...first.rows, ...second.rows].map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toHaveLength(1002);
  });

  it('puts one banner up for a double press, and lets go of one whose time ran out', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const admin = await staffIn();
    const body = { text: 'The realm rests from 22:00 to 22:30 UTC tonight.', hours: 1 };
    const [a, b] = await Promise.all([
      json<Banner>(admin, '/api/admin/banner', body),
      json<Banner>(admin, '/api/admin/banner', body),
    ]);
    expect(a.id).toBe(b.id);
    const log = await json<AuditResponse>(admin, '/api/admin/audit', { query: '', before: null });
    expect(log.entries.filter((e) => e.action === 'banner')).toHaveLength(1);
    s.clock.now += 3_600_000;
    expect((await call(admin, '/api/admin/banner/down', '')).statusCode).toBe(204);
    expect(s.ctx.db.select().from(serverSettings).where(eq(serverSettings.key, 'banner')).get()).toBeUndefined();
  });

  it("keeps a day gone by's count, but counts today until it is gone by", async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    await signUp(s, 'Rowan');
    s.clock.now += 3_600_000;
    await signUp(s, 'Wren');
    const admin = await staffIn();
    const day = (at: number) => new Date(at).toISOString().slice(0, 10);
    const today = day(s.clock.now);
    const visit = (name: string, d: string) =>
      s.ctx.db
        .insert(visits)
        .values({ playerId: idOf(name), day: d })
        .onConflictDoNothing()
        .run();
    s.ctx.db.delete(visits).run();
    visit('Rowan', today);
    const before = await json<AdminOverviewResponse>(admin, '/api/admin/overview', '');
    expect(before.days.at(-1)).toMatchObject({ day: today, active: 1 });
    // Wren comes later the same day; the next day both days are counted as they stand.
    visit('Wren', today);
    s.clock.now = Date.parse(`${today}T23:00:00Z`) + 3_600_000;
    const admin2 = await staffIn();
    const after = await json<AdminOverviewResponse>(admin2, '/api/admin/overview', '');
    expect(after.days.at(-2)).toMatchObject({ day: today, active: 2 });
    expect(after.days.at(-1)).toMatchObject({ active: 0 });
    expect(after.players).toMatchObject({ total: 2, activeToday: 0, activeWeek: 2 });
  });

  it("keeps each player's last day on their row, as the directory reads it, whoever writes the visit", async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    await signUp(s, 'Rowan');
    const seen = () => s.ctx.db.select().from(players).where(eq(players.name, 'Rowan')).get()!.seenDay;
    const today = new Date(s.clock.now).toISOString().slice(0, 10);
    expect(seen()).toBeNull();
    s.ctx.db
      .insert(visits)
      .values({ playerId: idOf('Rowan'), day: today })
      .run();
    expect(seen()).toBe(today);
    s.ctx.db
      .insert(visits)
      .values({ playerId: idOf('Rowan'), day: '2026-01-01' })
      .run();
    expect(seen()).toBe(today);
    s.ctx.db
      .insert(visits)
      .values({ playerId: idOf('Rowan'), day: '2099-01-01' })
      .run();
    expect(seen()).toBe('2099-01-01');
    const admin = await staffIn();
    const found = await json<DirectoryResponse>(admin, '/api/admin/directory', { ...ask('all'), sort: 'seen' });
    expect(found.rows[0]).toMatchObject({ name: 'Rowan', seen: '2099-01-01' });
  });
});
