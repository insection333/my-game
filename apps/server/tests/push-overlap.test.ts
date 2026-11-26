// Sweeps that overlap (session 273). The server sweeps notices each minute, and each send may wait ten seconds
// on a push service, one after another; a slow minute let the next sweep start while the first still waited,
// and both read the same notices as due: sent twice, counted twice against the three a day.
import { afterEach, describe, expect, it } from 'vitest';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const keys = { p256dh: 'BExampleKeyOfTheBrowser0123456789', auth: 'exampleAuth0123' };

describe('the push sweep', () => {
  it('never starts while the last one still waits on a push service', async () => {
    s = await server();
    const ids: string[] = [];
    for (const name of ['Rowan', 'Hazel']) {
      const cookie = await signUp(s, name);
      const on = await post(
        s,
        '/api/push/on',
        { endpoint: `https://fcm.googleapis.com/fcm/send/${name}`, keys, tz: 'UTC' },
        cookie,
      );
      expect(on.statusCode).toBe(204);
      const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
        player: { id: string };
      };
      ids.push(me.player.id);
    }
    for (const id of ids)
      s.ctx.push.now(id, {
        type: 'castleBesieged',
        at: s.clock.now,
        foe: 'Keeper',
        outcome: 'breached',
        lost: 100,
        marks: 2,
      });
    const sent: string[] = [];
    let release = () => undefined as void;
    const held = new Promise<void>((r) => (release = r));
    s.ctx.push.sender = async (sub) => {
      sent.push(sub.endpoint);
      await held;
      return 201;
    };
    s.clock.now += 60_000;
    const first = s.ctx.push.sweep();
    s.clock.now += 60_000;
    const second = s.ctx.push.sweep();
    release();
    await Promise.all([first, second]);
    expect(sent.sort()).toEqual(
      ids.map((_, i) => `https://fcm.googleapis.com/fcm/send/${['Rowan', 'Hazel'][i]}`).sort(),
    );
  });
});
