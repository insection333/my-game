// The sweep that foresees absences (session 285). When a subscribed player's last page closes, the next sweep
// plays a copy of their save a day ahead on the server's one thread, up to 0.4 s for a player two years in
// (session 271), and it did so for every player who left that minute in one go, holding every other player's
// answer for the sum. Since session 281 a page that stops answering counts as gone, so departures come more
// often. The sweep now lets the server answer between one player's foresight and the next.
import { afterEach, describe, expect, it } from 'vitest';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const keys = { p256dh: 'BExampleKeyOfTheBrowser0123456789', auth: 'exampleAuth0123' };

describe('the sweep of players gone', () => {
  it('lets the server answer between one foresight and the next', async () => {
    s = await server();
    const ids: string[] = [];
    for (const name of ['Rowan', 'Hazel', 'Alder']) {
      const cookie = await signUp(s, name);
      await post(
        s,
        '/api/push/on',
        { endpoint: `https://fcm.googleapis.com/fcm/send/${name}`, keys, tz: 'UTC' },
        cookie,
      );
      const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
        player: { id: string };
      };
      ids.push(me.player.id);
    }
    for (const id of ids) s.ctx.push.gone(id);
    s.clock.now += 61_000;
    const order: string[] = [];
    const advance = s.ctx.engine.advance.bind(s.ctx.engine);
    s.ctx.engine.advance = (...args) => {
      order.push('foresee');
      setImmediate(() => order.push('answer'));
      return advance(...args);
    };
    await s.ctx.push.sweep();
    expect(order.filter((x) => x === 'foresee')).toHaveLength(3);
    expect(order.slice(0, 3)).toEqual(['foresee', 'answer', 'foresee']);
  });
});
