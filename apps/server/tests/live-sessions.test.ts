// A session ended closes its open pages (session 158). Changing the password ends every other session (session
// 105), but their pages stayed open on the live channel and went on hearing the player's news (their notices,
// their castle's sieges, their unread letters) until they next sent a request; signing out left the page's
// other tabs listening the same way. Only the pages of the sessions ended are closed.
import { afterEach, describe, expect, it } from 'vitest';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());
const PASSWORD = 'a long enough secret';

const signIn = async () => {
  const r = await post(s, '/api/auth/sign-in', { name: 'Rowan', password: PASSWORD });
  return String(r.headers['set-cookie']).split(';')[0];
};
const open = async (cookie: string) => {
  const ws = await s.app.injectWS('/api/live', { headers: { cookie } });
  const closed = new Promise<number>((r) => ws.on('close', (c: number) => r(c)));
  return { ws, closed };
};
const shut = (p: Promise<number>) => Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), 200))]);

describe("a session's open pages", () => {
  it('close when another device changes the password, and stay open on that device', async () => {
    s = await server();
    await s.app.ready();
    const phone = await signUp(s, 'Rowan', PASSWORD);
    const desk = await signIn();
    const [onPhone, onDesk] = [await open(phone), await open(desk)];
    const r = await post(s, '/api/account/password', { current: PASSWORD, password: 'a new long secret' }, desk);
    expect(r.statusCode).toBe(204);
    expect(await shut(onPhone.closed)).toBe(4401);
    expect(await shut(onDesk.closed)).toBeNull();
    onDesk.ws.terminate();
  });

  it('close when their session signs out, leaving the other device', async () => {
    s = await server();
    await s.app.ready();
    const phone = await signUp(s, 'Rowan', PASSWORD);
    const desk = await signIn();
    const [onPhone, onDesk] = [await open(phone), await open(desk)];
    expect((await post(s, '/api/auth/sign-out', '', desk)).statusCode).toBe(204);
    expect(await shut(onDesk.closed)).toBe(4401);
    expect(await shut(onPhone.closed)).toBeNull();
    onPhone.ws.terminate();
  });
});
