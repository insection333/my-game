import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { players } from '../src/db/schema.ts';
import { code, post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const PW = 'a long enough secret';
const game = (cookie?: string) => s.app.inject({ method: 'GET', url: '/api/game', headers: cookie ? { cookie } : {} });
const signIn = (name: string, password: string, ip = '10.0.0.1') =>
  s.app.inject({
    method: 'POST',
    url: '/api/auth/sign-in',
    remoteAddress: ip,
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({ name, password }),
  });

describe('sign up', () => {
  it('makes a player with a save and signs them in with a hardened cookie', async () => {
    s = await server();
    const r = await post(s, '/api/auth/sign-up', { name: 'Rowan', password: PW, ageConfirmed: true });
    expect(r.statusCode).toBe(201);
    const cookie = String(r.headers['set-cookie']);
    expect(cookie).toMatch(/^ic_session=[A-Za-z0-9_-]{43}; Max-Age=2592000; Path=\/; HttpOnly; SameSite=Lax$/);
    expect((await game(cookie.split(';')[0])).statusCode).toBe(200);
  });

  it('marks the cookie Secure on the live site', async () => {
    s = await server({ secureCookies: true });
    const r = await post(s, '/api/auth/sign-up', { name: 'Rowan', password: PW, ageConfirmed: true });
    expect(String(r.headers['set-cookie'])).toContain('Secure');
  });

  it('stores the password only as an Argon2id hash', async () => {
    s = await server();
    await signUp(s);
    const row = s.ctx.db.select().from(players).get()!;
    expect(row.passwordHash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(row.passwordHash).not.toContain(PW);
  });

  it('refuses a name already taken, whatever its case', async () => {
    s = await server();
    await signUp(s, 'Rowan');
    const r = await post(s, '/api/auth/sign-up', { name: 'ROWAN', password: PW, ageConfirmed: true });
    expect([r.statusCode, code(r)]).toEqual([409, 'nameTaken']);
  });

  it('refuses players who do not confirm they are 13 or older', async () => {
    s = await server();
    const r = await post(s, '/api/auth/sign-up', { name: 'Rowan', password: PW, ageConfirmed: false });
    expect([r.statusCode, code(r)]).toEqual([400, 'invalidInput']);
  });

  it('allows five sign-ups an hour from one address, then says when to try again', async () => {
    s = await server();
    const up = (n: number) =>
      s.app.inject({
        method: 'POST',
        url: '/api/auth/sign-up',
        remoteAddress: '10.0.0.9',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ name: `Player ${n}`, password: PW, ageConfirmed: true }),
      });
    for (let i = 0; i < 5; i++) expect((await up(i)).statusCode).toBe(201);
    const sixth = await up(5);
    expect([sixth.statusCode, code(sixth), sixth.headers['retry-after']]).toEqual([429, 'tooManyTries', '3600']);
    s.clock.now += 3600_001;
    expect((await up(6)).statusCode).toBe(201);
  });
});

describe('client addresses', () => {
  it('ignores X-Forwarded-For from anywhere but a proxy on this machine, so limits cannot be dodged', async () => {
    s = await server();
    const up = (n: number) =>
      s.app.inject({
        method: 'POST',
        url: '/api/auth/sign-up',
        remoteAddress: '203.0.113.7',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': `198.51.100.${n}` },
        payload: JSON.stringify({ name: `Spoof ${n}`, password: PW, ageConfirmed: true }),
      });
    for (let i = 0; i < 5; i++) expect((await up(i)).statusCode).toBe(201);
    expect((await up(5)).statusCode).toBe(429);
  });
});

describe('sign in and out', () => {
  it('signs in with the right password, in any case of the name', async () => {
    s = await server();
    await signUp(s, 'Rowan');
    const r = await signIn('rowan', PW);
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body)).toMatchObject({ player: { name: 'Rowan' } });
  });

  it('answers a wrong password and an unknown name the same way', async () => {
    s = await server();
    await signUp(s, 'Rowan');
    const wrong = await signIn('Rowan', 'not the password');
    const unknown = await signIn('Nobody', PW);
    expect([wrong.statusCode, code(wrong)]).toEqual([401, 'wrongNameOrPassword']);
    expect([unknown.statusCode, unknown.body]).toEqual([wrong.statusCode, wrong.body]);
  });

  it('allows ten tries a name in 15 minutes, from any address', async () => {
    s = await server();
    await signUp(s, 'Rowan');
    for (let i = 0; i < 10; i++) expect((await signIn('Rowan', 'wrong guess', `10.0.1.${i}`)).statusCode).toBe(401);
    const blocked = await signIn('Rowan', PW, '10.0.2.1');
    expect([blocked.statusCode, code(blocked)]).toEqual([429, 'tooManyTries']);
    s.clock.now += 15 * 60_000 + 1;
    expect((await signIn('Rowan', PW, '10.0.2.1')).statusCode).toBe(200);
  });

  it('allows twenty tries an address in 15 minutes, across names', async () => {
    s = await server();
    for (let i = 0; i < 20; i++) expect((await signIn(`Name ${i}`, 'wrong guess', '10.0.3.3')).statusCode).toBe(401);
    expect((await signIn('Name 99', 'wrong guess', '10.0.3.3')).statusCode).toBe(429);
  });

  it('signs out: the session stops working', async () => {
    s = await server();
    const cookie = await signUp(s);
    expect((await post(s, '/api/auth/sign-out', '', cookie)).statusCode).toBe(204);
    expect(code(await game(cookie))).toBe('notSignedIn');
  });

  it('ends a session unused for 30 days, and renews one in use', async () => {
    s = await server();
    const cookie = await signUp(s);
    s.clock.now += 20 * 86_400_000;
    expect((await game(cookie)).statusCode).toBe(200);
    s.clock.now += 20 * 86_400_000;
    expect((await game(cookie)).statusCode).toBe(200);
    s.clock.now += 31 * 86_400_000;
    expect((await game(cookie)).statusCode).toBe(401);
  });

  it('refuses a banned player, even with a session', async () => {
    s = await server();
    const cookie = await signUp(s, 'Rowan');
    s.ctx.db.update(players).set({ bannedAt: s.clock.now }).where(eq(players.name, 'Rowan')).run();
    expect(code(await game(cookie))).toBe('banned');
    expect(code(await signIn('Rowan', PW))).toBe('banned');
  });

  it('says who is signed in, and which features are on', async () => {
    s = await server();
    expect(JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me' })).body)).toEqual({
      player: null,
      flags: s.config.flags,
      email: { enabled: false },
      admin: false,
    });
    const cookie = await signUp(s, 'Rowan');
    const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
      player: { name: string };
    };
    expect(me.player.name).toBe('Rowan');
  });
});
