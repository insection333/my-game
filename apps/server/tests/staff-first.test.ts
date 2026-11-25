// The console's first password (session 237, the owner): with no secret set, the console's account is made
// with "Password", and every admin route refuses it until a password of the owner's own is chosen; the one
// chosen stands across restarts; a secret set later takes over once, and a password changed in the console
// after it stands until the secret itself changes.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { code, ORIGIN, post, server, signUpAdmin, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const FIRST = 'Password';
const MINE = 'a password of my own';
const signIn = (password: string) =>
  post(s, '/api/auth/sign-in', { name: 'Admin', password }, undefined, { origin: ORIGIN });
const cookieOf = (r: { headers: Record<string, unknown> }) => String(r.headers['set-cookie']).split(';')[0];
const me = async (cookie: string) =>
  JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
    player: { name: string } | null;
    staff: boolean;
    mustChangePassword?: boolean;
  };
const call = (cookie: string, url: string, body: unknown) => post(s, url, body, cookie, { origin: ORIGIN });
const change = (cookie: string, current: string, password: string) =>
  call(cookie, '/api/account/console-password', { current, password });
const dbFile = () => join(mkdtempSync(join(tmpdir(), 'ic-staff-')), 'staff.db');

describe("the console's first password", () => {
  it('signs in with "Password", and opens nothing but the change until its own is chosen', async () => {
    s = await server({ staff: { name: 'Admin', password: null, first: FIRST } });
    const first = cookieOf(await signIn(FIRST));
    expect(await me(first)).toMatchObject({ staff: true, mustChangePassword: true });
    expect(code(await call(first, '/api/admin/overview', ''))).toBe('mustChangePassword');
    expect(code(await call(first, '/api/admin/players', { query: '' }))).toBe('mustChangePassword');
    const other = cookieOf(await signIn(FIRST));
    // Asked the current password; never the first again, in any case, nor the one it replaces; the players' length.
    expect(code(await change(first, 'not it', MINE))).toBe('wrongPassword');
    expect(code(await change(first, FIRST, 'PASSWORD'))).toBe('invalidInput');
    expect(code(await change(first, FIRST, 'password'))).toBe('invalidInput');
    expect(code(await change(first, FIRST, 'short'))).toBe('invalidInput');
    expect((await change(first, FIRST, MINE)).statusCode).toBe(204);
    expect((await me(first)).mustChangePassword).toBeUndefined();
    expect((await call(first, '/api/admin/overview', '')).statusCode).toBe(200);
    // The console's other browser is signed out; the first password no longer signs in.
    expect((await me(other)).player).toBeNull();
    expect(code(await signIn(FIRST))).toBe('wrongNameOrPassword');
    expect((await signIn(MINE)).statusCode).toBe(200);
    const log = JSON.parse((await call(first, '/api/admin/audit', { query: '', before: null })).body) as {
      entries: { action: string }[];
    };
    expect(log.entries.map((e) => e.action)).toEqual(['consolePassword']);
  });

  it('refuses the first password again once changed, and a ten-letter one that is only it longer', async () => {
    s = await server({ staff: { name: 'Admin', password: null, first: 'Password12' } });
    const cookie = cookieOf(await signIn('Password12'));
    expect(code(await change(cookie, 'Password12', 'password12'))).toBe('samePassword');
    expect(code(await change(cookie, 'Password12', 'Password12'))).toBe('samePassword');
  });

  it('keeps the password chosen across a restart, until a secret is set, which takes over once', async () => {
    const dbPath = dbFile();
    s = await server({ dbPath, staff: { name: 'Admin', password: null, first: FIRST } });
    await change(cookieOf(await signIn(FIRST)), FIRST, MINE);
    await s.close();
    s = await server({ dbPath, staff: { name: 'Admin', password: null, first: FIRST } });
    expect(code(await signIn(FIRST))).toBe('wrongNameOrPassword');
    const cookie = cookieOf(await signIn(MINE));
    expect((await me(cookie)).mustChangePassword).toBeUndefined();
    await s.close();
    s = await server({ dbPath, staff: { name: 'Admin', password: 'the owner secret 1', first: FIRST } });
    expect(code(await signIn(MINE))).toBe('wrongNameOrPassword');
    const owner = cookieOf(await signIn('the owner secret 1'));
    expect((await call(owner, '/api/admin/overview', '')).statusCode).toBe(200);
    // Changed in the console, it stands across a restart under the same secret.
    expect((await change(owner, 'the owner secret 1', 'changed in the console')).statusCode).toBe(204);
    await s.close();
    s = await server({ dbPath, staff: { name: 'Admin', password: 'the owner secret 1', first: FIRST } });
    expect((await signIn('changed in the console')).statusCode).toBe(200);
    await s.close();
    s = await server({ dbPath, staff: { name: 'Admin', password: 'the owner secret 2', first: FIRST } });
    expect((await signIn('the owner secret 2')).statusCode).toBe(200);
  });

  it("is the console's own: an admin on the list changes theirs in Settings", async () => {
    s = await server({ staff: { name: 'Admin', password: null, first: FIRST } });
    const wren = await signUpAdmin(s, 'Wren');
    expect(code(await change(wren, 'a long enough secret', MINE))).toBe('notAdmin');
  });
});
