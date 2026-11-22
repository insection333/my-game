// Notices while away (session 171). The server does not play a save while its player is away, so a lane
// that stopped was known only when they came back. Now, a minute after a player's last page closes, the
// absence is played ahead once and what will need them is sent when it comes: here, smelting runs out of
// ore. Held to the rules: only to a browser's push service, never while a page is open, never at night in
// the player's own clock (held to the morning), three a day at most, and gone with the account.
import { afterEach, describe, expect, it } from 'vitest';
import { post, server, signUp, T0, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const FCM = 'https://fcm.googleapis.com/fcm/send/rowan-phone';
const keys = { p256dh: 'BExampleKeyOfTheBrowser0123456789', auth: 'exampleAuth0123' };

async function player(name = 'Rowan', tz = 'UTC') {
  const cookie = await signUp(s, name);
  const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
    player: { id: string };
  };
  const on = await post(s, '/api/push/on', { endpoint: `${FCM}-${name}`, keys, tz }, cookie);
  expect(on.statusCode).toBe(204);
  return { cookie, id: me.player.id };
}

let req = 0;
/** Copper ore and smelting started: it runs dry some minutes later (two minutes for 40 ore). */
async function smelt(p: { cookie: string; id: string }, ore = 40) {
  const saved = s.ctx.store.read(p.id, s.clock.now)!;
  const state = { ...saved.doc.state, items: { ...saved.doc.state.items, 'copper-ore': ore } };
  s.ctx.store.write(p.id, { ...saved.doc, state }, saved.rev, s.clock.now);
  await post(
    s,
    '/api/game/command',
    {
      requestId: `req-smelt-${++req}`,
      command: { type: 'start', lane: 'artisan', action: { feature: 'smithing', id: 'copper-bar' } },
    },
    p.cookie,
  );
}

function capture() {
  const sent: { endpoint: string; at: number; payload: { title: string; body: string; url: string } }[] = [];
  s.ctx.push.sender = (sub, payload) => {
    sent.push({
      endpoint: sub.endpoint,
      at: s.clock.now,
      payload: JSON.parse(payload) as (typeof sent)[number]['payload'],
    });
    return Promise.resolve(201);
  };
  return sent;
}

/** Moves the clock a minute at a time, sweeping as the server does, for `minutes`. */
async function pass(minutes: number) {
  for (let i = 0; i < minutes; i++) {
    s.clock.now += 60_000;
    await s.ctx.push.sweep();
  }
}

describe('notices while away', () => {
  it('foresees a lane that will stop, and says so when it does, leading to its remedy', async () => {
    s = await server();
    const sent = capture();
    const p = await player();
    await smelt(p);
    s.ctx.push.gone(p.id);
    await pass(1);
    expect(sent).toHaveLength(0);
    await pass(30);
    expect(sent).toHaveLength(1);
    expect(sent[0].payload.body).toMatch(/Artisan stopped: out of copper ore/i);
    expect(sent[0].payload.url).not.toBe('/');
    // Said once.
    await pass(30);
    expect(sent).toHaveLength(1);
  });

  it('sends nothing to a player who came back, or whose page is open', async () => {
    s = await server();
    const sent = capture();
    const p = await player();
    await smelt(p);
    s.ctx.push.gone(p.id);
    await pass(2);
    s.ctx.push.back(p.id);
    await pass(60);
    expect(sent).toHaveLength(0);
  });

  it('holds a notice due at night to 08:00 in the player’s own clock', async () => {
    s = await server();
    // 10:57 UTC is 21:57 in Sydney; the ore runs out five minutes later, past 22:00 there.
    s.clock.now = T0 + 2 * 3_600_000 - 3 * 60_000;
    const sent = capture();
    const p = await player('Rowan', 'Australia/Sydney');
    await smelt(p);
    s.ctx.push.gone(p.id);
    await pass(60);
    expect(sent).toHaveLength(0);
    // 08:00 in Sydney is 21:00 UTC: the held notice comes then.
    await pass(10 * 60);
    expect(sent).toHaveLength(1);
    const at = new Date(sent[0].at).toISOString();
    expect(at >= '2026-10-20T21:00' && at < '2026-10-20T21:02').toBe(true);
  });

  it('sends three a day at most', async () => {
    s = await server();
    const sent = capture();
    const p = await player();
    for (let i = 0; i < 5; i++) {
      await smelt(p);
      s.ctx.push.gone(p.id);
      await pass(45);
    }
    expect(sent).toHaveLength(3);
  });

  it('takes only a browser’s push service, and lets go of one the browser has dropped', async () => {
    s = await server();
    const cookie = await signUp(s);
    for (const endpoint of [
      'http://127.0.0.1:3000/api/admin',
      'https://example.com/push',
      'https://fcm.googleapis.com.evil.io/x',
    ])
      expect((await post(s, '/api/push/on', { endpoint, keys, tz: 'UTC' }, cookie)).statusCode).toBe(400);
    expect((await post(s, '/api/push/on', { endpoint: FCM, keys, tz: 'Mars/Olympus' }, cookie)).statusCode).toBe(400);
    const p = await player('Ash');
    let calls = 0;
    s.ctx.push.sender = () => (++calls, Promise.resolve(410));
    await smelt(p);
    s.ctx.push.gone(p.id);
    await pass(45);
    expect(calls).toBe(1);
    await smelt(p);
    s.ctx.push.gone(p.id);
    await pass(45);
    expect(calls).toBe(1);
  });
});
