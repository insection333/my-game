// Changing one's own password (session 105): a player had no way to, not even after an admin's reset handed
// them a password made for them. With the current password, the new one works at once, this page stays
// signed in, and every other session is ended (as a reset ends them all).
import { afterEach, describe, expect, it } from 'vitest';
import { code, post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const OLD = 'a long enough secret';
const NEW = 'another long secret';
const signIn = (password: string) => post(s, '/api/auth/sign-in', { name: 'Rowan', password });
const signedIn = async (cookie: string) =>
  (JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as { player: unknown })
    .player !== null;

describe('changing your password', () => {
  it('takes the current password, keeps this page signed in and ends the others', async () => {
    s = await server();
    const here = await signUp(s, 'Rowan', OLD);
    const elsewhere = String((await signIn(OLD)).headers['set-cookie']).split(';')[0];
    expect(code(await post(s, '/api/account/password', { current: 'not my password', password: NEW }, here))).toBe(
      'wrongPassword',
    );
    expect((await post(s, '/api/account/password', { current: OLD, password: NEW }, here)).statusCode).toBe(204);
    expect(await signedIn(here)).toBe(true);
    expect(await signedIn(elsewhere)).toBe(false);
    expect(code(await signIn(OLD))).toBe('wrongNameOrPassword');
    expect((await signIn(NEW)).statusCode).toBe(200);
  });

  it('holds a new password to the sign-up rules, and a signed-out page to nothing', async () => {
    s = await server();
    const here = await signUp(s, 'Rowan', OLD);
    expect((await post(s, '/api/account/password', { current: OLD, password: 'short' }, here)).statusCode).toBe(400);
    expect((await post(s, '/api/account/password', { current: OLD, password: NEW })).statusCode).toBe(401);
  });
});
