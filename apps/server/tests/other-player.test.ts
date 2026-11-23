// Two players in one browser (session 208): the session's cookie belongs to the browser, so when Birch signed
// in on a second tab, Alder's tab went on showing Alder's game while its presses carried Birch's cookie and
// changed Birch's save, whose state then appeared in Alder's tab; and its live channel, reopening, heard
// Birch's news. A page now names the player it shows (x-player, or ?player= on the live channel), and a
// request or channel for another player is refused (otherPlayer, 4409), so the page loads afresh as the
// player whose session the browser holds.
import { afterEach, describe, expect, it } from 'vitest';
import { server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const idOf = async (cookie: string) =>
  (
    JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
      player: { id: string };
    }
  ).player.id;
const game = (cookie: string, player?: string) =>
  s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie, ...(player ? { 'x-player': player } : {}) } });

describe('a page of one player under another player’s session', () => {
  it('is refused, so the page loads as the player signed in', async () => {
    s = await server();
    const alder = await idOf(await signUp(s, 'Alder'));
    const birch = await signUp(s, 'Birch');
    const r = await game(birch, alder);
    expect(r.statusCode).toBe(409);
    expect(JSON.parse(r.body)).toEqual({ error: { code: 'otherPlayer' } });
    expect((await game(birch, await idOf(birch))).statusCode).toBe(200);
    expect((await game(birch)).statusCode).toBe(200);
  });

  it('is closed on the live channel with its own code', async () => {
    s = await server();
    await s.app.ready();
    const alder = await idOf(await signUp(s, 'Alder'));
    const birch = await signUp(s, 'Birch');
    const ws = await s.app.injectWS(`/api/live?player=${alder}`, { headers: { cookie: birch } });
    const code = await Promise.race([
      new Promise<number>((r) => ws.on('close', (c: number) => r(c))),
      new Promise<null>((r) => setTimeout(() => r(null), 300)),
    ]);
    expect(code).toBe(4409);
    ws.terminate();
  });
});
