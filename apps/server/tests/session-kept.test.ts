// A player who comes back every day stays signed in (session 157). The server renewed its own record of
// a session as it was used, but the browser's cookie kept the 30 days it was given at sign-in, so the
// browser dropped it on day 30 and a daily player found the welcome page's Create account form.
import { describe, expect, it } from 'vitest';
import { ORIGIN, server, signUp } from './helpers.ts';

const DAY = 86_400_000;

/** A browser's cookie jar for one cookie: kept until its Max-Age runs out, renewed by each Set-Cookie. */
function jar(first: string, at: number) {
  let value = first;
  let until = at + 30 * DAY;
  return {
    header: (now: number) => (now < until ? value : ''),
    take(setCookie: string | string[] | undefined, now: number) {
      for (const c of ([] as string[]).concat(setCookie ?? [])) {
        if (!c.startsWith('ic_session=') && !c.startsWith(value.split('=')[0] + '=')) continue;
        value = c.split(';')[0];
        const age = /Max-Age=(\d+)/i.exec(c);
        if (age) until = now + Number(age[1]) * 1000;
      }
    },
  };
}

describe('a session kept by use', () => {
  it('stays signed in for a player who opens the game every day', async () => {
    const s = await server();
    const cookies = jar(await signUp(s), s.clock.now);
    for (let day = 1; day <= 40; day++) {
      s.clock.now += DAY;
      const r = await s.app.inject({
        method: 'GET',
        url: '/api/me',
        headers: { cookie: cookies.header(s.clock.now), origin: ORIGIN },
      });
      cookies.take(r.headers['set-cookie'], s.clock.now);
      expect(r.json<{ player: unknown }>().player, `day ${day}`).not.toBeNull();
    }
    await s.app.close();
  });

  it('does not keep a cookie for a session that has ended', async () => {
    const s = await server();
    const cookie = await signUp(s);
    s.clock.now += 31 * DAY;
    const r = await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie, origin: ORIGIN } });
    expect(r.json<{ player: unknown }>().player).toBeNull();
    expect(String(r.headers['set-cookie'] ?? '')).not.toMatch(/Max-Age=2592000/);
    await s.app.close();
  });
});
