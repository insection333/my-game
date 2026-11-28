// What the API answers is a player's own (their save, their letters) or, for an admin, any player's record; a
// browser could keep such an answer in its disk cache, where a shared computer kept it after signing out
// (session 295). Every answer of the API says not to store it; the page's own files keep their caching.
import { afterEach, describe, expect, it } from 'vitest';
import { server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

describe("the API's answers", () => {
  it('are never stored by the browser, the game, a refusal or a page not found alike', async () => {
    s = await server();
    const cookie = await signUp(s, 'Rowan');
    for (const url of ['/api/game', '/api/me', '/api/no-such-route']) {
      const r = await s.app.inject({ method: 'GET', url, headers: { cookie } });
      expect(r.headers['cache-control'], url).toBe('no-store');
    }
    const refused = await s.app.inject({ method: 'GET', url: '/api/game' });
    expect(refused.headers['cache-control']).toBe('no-store');
  });
});
