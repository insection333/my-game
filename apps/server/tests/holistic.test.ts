// The holistic sweep (session 238), of the parts a sweep of the pages never reaches: the rate limiter's
// memory under a flood, the live channel's opening from another site, browser error reports from a script,
// the request log, and a deleted admin's name on the realm's banner.
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { ERRORS_A_DAY } from '../src/app.ts';
import { players, serverSettings, telemetry } from '../src/db/schema.ts';
import { RateLimiter } from '../src/security.ts';
import { ORIGIN, post, server, signUpAdmin, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());
const MIN = 60_000;
const HOUR = 60 * MIN;

describe('the rate limiter', () => {
  it("keeps an hour's count through a flood of other keys, and sweeps at most once a minute", () => {
    const limiter = new RateLimiter();
    let now = 1_000_000;
    // Five sign-in tries on one account, an hour's limit of five.
    for (let i = 0; i < 5; i++) expect(limiter.take('signin:rowan', 5, HOUR, (now += 1000)).ok).toBe(true);
    // Ten minutes on, a flood of sign-ups from fifty thousand addresses, each its own key of a minute.
    now += 10 * MIN;
    for (let i = 0; i <= RateLimiter.SWEEP_AT; i++) limiter.take(`signup:${i}`, 3, MIN, now);
    now += 2 * MIN;
    limiter.take('signup:one-more', 3, MIN, now);
    // The sweep let go of the minute's keys, and kept the hour's tries: the sixth is still refused.
    expect(limiter.size).toBeLessThan(10);
    expect(limiter.take('signin:rowan', 5, HOUR, now).ok).toBe(false);
  });
});

describe('the live channel', () => {
  it('is never opened from another site', async () => {
    s = await server();
    const evil = await s.app.inject({ method: 'GET', url: '/api/live', headers: { origin: 'https://evil.example' } });
    expect(evil.statusCode).toBe(403);
    const ours = await s.app.inject({ method: 'GET', url: '/api/live', headers: { origin: ORIGIN } });
    expect(ours.statusCode).not.toBe(403);
  });
});

describe('browser error reports', () => {
  it("keeps a day's worth from one address, and takes the rest without keeping them", async () => {
    s = await server();
    const report = () =>
      post(s, '/api/errors', { message: 'TypeError: x is undefined', url: '/combat' }, undefined, { origin: ORIGIN });
    for (let i = 0; i < ERRORS_A_DAY + 20; i++) {
      s.clock.now += 3 * 1000;
      expect((await report()).statusCode).toBe(204);
    }
    const kept = s.ctx.db.select().from(telemetry).where(eq(telemetry.type, 'browserError')).all();
    expect(kept).toHaveLength(ERRORS_A_DAY);
  });
});

describe('the request log', () => {
  it('writes no line for each request (it carried every connection address)', async () => {
    s = await server();
    expect(s.app.initialConfig.disableRequestLogging).toBe(true);
  });
});

describe("a deleted admin and the realm's banner", () => {
  it('leaves the banner up, no longer naming them', async () => {
    s = await server();
    const wren = await signUpAdmin(s, 'Wren');
    const text = 'The realm rests from 22:00 to 22:30 UTC tonight.';
    expect((await post(s, '/api/admin/banner', { text, hours: 6 }, wren, { origin: ORIGIN })).statusCode).toBe(200);
    const id = s.ctx.db.select().from(players).where(eq(players.name, 'Wren')).get()!.id;
    const hazel = await signUpAdmin(s, 'Hazel');
    expect(
      (await post(s, '/api/admin/delete', { playerId: id, name: 'Wren' }, hazel, { origin: ORIGIN })).statusCode,
    ).toBe(204);
    const stored = s.ctx.db.select().from(serverSettings).where(eq(serverSettings.key, 'banner')).get()!.value;
    expect(stored).not.toContain('Wren');
    const live = JSON.parse((await post(s, '/api/admin/live', '', hazel, { origin: ORIGIN })).body) as {
      banner: { text: string; actor: string };
    };
    expect(live.banner).toMatchObject({ text, actor: '' });
  });
});
