// The admin console's own account (session 227): made at start from the server's secret, never from the
// repository; it signs in as anyone does, reaches the admin routes, never plays (refused every game route,
// no save), stands in no list or count of players, cannot be written to or reported, and its session lasts
// twelve hours from sign-in. A changed secret is its new password at the next start; no secret, no account.
import { afterEach, describe, expect, it } from 'vitest';
import { code, ORIGIN, post, server, signUp, type TestServer } from './helpers.ts';

const SECRET = 'console secret 1';
let s: TestServer;
afterEach(() => s?.close());

const signIn = (name: string, password: string) =>
  post(s, '/api/auth/sign-in', { name, password }, undefined, { origin: ORIGIN });
const cookieOf = (r: { headers: Record<string, unknown> }) => String(r.headers['set-cookie']).split(';')[0];
const me = async (cookie: string) =>
  JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
    player: { name: string } | null;
    admin: boolean;
    staff: boolean;
  };

describe('the console account', () => {
  it('signs in as Admin, reaches the admin routes, and is sent to the console', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const r = await signIn('admin', SECRET);
    expect(r.statusCode).toBe(200);
    // Twelve hours, not thirty days.
    expect(String(r.headers['set-cookie'])).toContain('Max-Age=43200');
    const cookie = cookieOf(r);
    expect(await me(cookie)).toMatchObject({ player: { name: 'Admin' }, admin: true, staff: true });
    expect((await post(s, '/api/admin/players', { query: '' }, cookie, { origin: ORIGIN })).statusCode).toBe(200);
    expect(code(await signIn('Admin', 'not it'))).toBe('wrongNameOrPassword');
  });

  it('never plays, and stands in no list of players', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const cookie = cookieOf(await signIn('Admin', SECRET));
    const game = await s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie } });
    expect(code(game)).toBe('staffAccount');
    const rowan = await signUp(s, 'Rowan');
    const found = JSON.parse((await post(s, '/api/admin/players', { query: '' }, cookie, { origin: ORIGIN })).body) as {
      players: { name: string }[];
    };
    expect(found.players.map((p) => p.name)).toEqual(['Rowan']);
    // No one writes to it, reports it, or takes its name.
    const mail = await post(s, '/api/mail/send', { to: 'Admin', body: 'hello there' }, rowan, { origin: ORIGIN });
    expect(JSON.parse(mail.body)).toEqual({ ok: false, reason: 'noPlayer' });
    expect(code(await post(s, '/api/report', { name: 'Admin', reason: 'name' }, rowan, { origin: ORIGIN }))).toBe(
      'notFound',
    );
    expect(
      code(await post(s, '/api/auth/sign-up', { name: 'Admin', password: SECRET, ageConfirmed: true }, undefined)),
    ).toBe('nameNotAllowed');
  });

  it('signs out, and its session ends twelve hours after sign-in however it is used', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const cookie = cookieOf(await signIn('Admin', SECRET));
    s.clock.now += 11 * 3_600_000;
    expect((await me(cookie)).staff).toBe(true);
    s.clock.now += 2 * 3_600_000;
    expect((await me(cookie)).player).toBeNull();
    const again = cookieOf(await signIn('Admin', SECRET));
    expect((await post(s, '/api/auth/sign-out', '', again, { origin: ORIGIN })).statusCode).toBe(204);
    expect((await me(again)).player).toBeNull();
  });

  it('takes a changed secret as its password at the next start, and is not made without one', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const db = s.config.dbPath;
    expect(db).toBe(':memory:');
    s.config.staff.password = 'console secret 2';
    const { ensureStaff } = await import('../src/auth/staff.ts');
    expect(await ensureStaff(s.ctx)).toBe('reset');
    expect(code(await signIn('Admin', SECRET))).toBe('wrongNameOrPassword');
    expect((await signIn('Admin', 'console secret 2')).statusCode).toBe(200);
    expect(await ensureStaff(s.ctx)).toBe('kept');
    await s.close();
    s = await server();
    expect(code(await signIn('Admin', SECRET))).toBe('wrongNameOrPassword');
  });
});

// Session 294: the server knew a secret it had seen by a SHA-256 of it kept in its settings, so a copy of the
// database (a backup) gave the console's password to a guesser at billions of tries a second, where its
// Argon2id hash beside it takes a fraction of a second each. The mark is an Argon2id hash too; an older one is
// still known once, and replaced.
describe("the console secret's mark", () => {
  it('is kept as slowly as a password, and an older fast mark is known once and replaced', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const { eq } = await import('drizzle-orm');
    const { serverSettings } = await import('../src/db/schema.ts');
    const { createHash } = await import('node:crypto');
    const { ensureStaff } = await import('../src/auth/staff.ts');
    const mark = () =>
      s.ctx.db.select().from(serverSettings).where(eq(serverSettings.key, 'staff.secret')).get()?.value;
    expect(mark()).toMatch(/^\$argon2id\$/);
    expect(mark()).not.toContain(createHash('sha256').update(`idle-clash console:${SECRET}`).digest('hex'));
    expect(await ensureStaff(s.ctx)).toBe('kept');
    const old = createHash('sha256').update(`idle-clash console:${SECRET}`).digest('hex');
    s.ctx.db.update(serverSettings).set({ value: old }).where(eq(serverSettings.key, 'staff.secret')).run();
    expect(await ensureStaff(s.ctx)).toBe('kept');
    expect(mark()).toMatch(/^\$argon2id\$/);
    expect(await ensureStaff(s.ctx)).toBe('kept');
  });
});

describe("the console account's password from the settings", () => {
  it('is read as written, or from base64 as the deploy writes it, every character itself', async () => {
    const { consolePassword } = await import('../src/config.ts');
    const odd = `Black'magic1$ "quoted" \\ and spaces`;
    expect(consolePassword({ ADMIN_ACCOUNT_PASSWORD_B64: Buffer.from(odd).toString('base64') })).toBe(odd);
    expect(consolePassword({ ADMIN_ACCOUNT_PASSWORD: 'plain' })).toBe('plain');
    expect(consolePassword({})).toBeNull();
  });
});
