import { afterEach, describe, expect, it } from 'vitest';
import { code, post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const tokenIn = (text: string) => /token=([A-Za-z0-9_-]+)/.exec(text)![1];
const signIn = (password: string) => post(s, '/api/auth/sign-in', { name: 'Rowan', password });

describe('with email switched off (the default)', () => {
  it('has no email routes and sends nothing', async () => {
    s = await server();
    const cookie = await signUp(s);
    for (const [url, body] of [
      ['/api/account/email', { email: 'rowan@example.com' }],
      ['/api/auth/recover', { name: 'Rowan' }],
      ['/api/auth/reset', { token: 'a'.repeat(24), password: 'a new long secret' }],
    ] as const) {
      expect(code(await post(s, url, body, cookie))).toBe('notFound');
    }
    expect(s.mailer.sent).toEqual([]);
  });
});

describe('with email switched on', () => {
  it('confirms an address with a one-use link', async () => {
    s = await server({ emailEnabled: true });
    const cookie = await signUp(s);
    expect((await post(s, '/api/account/email', { email: 'rowan@example.com' }, cookie)).statusCode).toBe(202);
    const token = tokenIn(s.mailer.sent[0].text);
    expect((await post(s, '/api/account/email/confirm', { token })).statusCode).toBe(204);
    expect(code(await post(s, '/api/account/email/confirm', { token }))).toBe('tokenInvalid');
  });

  it('resets a forgotten password through a confirmed address, ending every session', async () => {
    s = await server({ emailEnabled: true });
    const cookie = await signUp(s);
    await post(s, '/api/account/email', { email: 'rowan@example.com' }, cookie);
    await post(s, '/api/account/email/confirm', { token: tokenIn(s.mailer.sent[0].text) });
    expect((await post(s, '/api/auth/recover', { name: 'rowan' })).statusCode).toBe(202);
    const reset = tokenIn(s.mailer.sent[1].text);
    expect((await post(s, '/api/auth/reset', { token: reset, password: 'a brand new secret' })).statusCode).toBe(204);
    expect(code(await s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie } }))).toBe('notSignedIn');
    expect((await signIn('a brand new secret')).statusCode).toBe(200);
    expect(code(await signIn('a long enough secret'))).toBe('wrongNameOrPassword');
  });

  it('gives the same answer for a name with no address or no account, and sends nothing', async () => {
    s = await server({ emailEnabled: true });
    await signUp(s);
    expect((await post(s, '/api/auth/recover', { name: 'Rowan' })).statusCode).toBe(202);
    expect((await post(s, '/api/auth/recover', { name: 'Nobody' })).statusCode).toBe(202);
    expect(s.mailer.sent).toEqual([]);
  });

  it('lets a reset link expire after an hour', async () => {
    s = await server({ emailEnabled: true });
    const cookie = await signUp(s);
    await post(s, '/api/account/email', { email: 'rowan@example.com' }, cookie);
    await post(s, '/api/account/email/confirm', { token: tokenIn(s.mailer.sent[0].text) });
    await post(s, '/api/auth/recover', { name: 'Rowan' });
    s.clock.now += 3600_001;
    const r = await post(s, '/api/auth/reset', {
      token: tokenIn(s.mailer.sent[1].text),
      password: 'a brand new secret',
    });
    expect(code(r)).toBe('tokenInvalid');
  });
});
