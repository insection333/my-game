import type { LiveMessage } from '@idle-clash/contracts';
import { FEATURES } from '@idle-clash/features';
import { seeded, type State } from '@idle-clash/kernel';
import { afterEach, describe, expect, it } from 'vitest';
import { telemetry } from '../src/db/schema.ts';
import { code, notes, ORIGIN, post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const pine = { feature: 'woodcutting', id: 'pine-tree' };
const command = (cookie: string, requestId: string, cmd: unknown) =>
  post(s, '/api/game/command', { requestId, command: cmd }, cookie);
const state = async (cookie: string) =>
  (JSON.parse((await s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie } })).body) as { state: State })
    .state;

describe('the game over HTTP', () => {
  it('runs a command and keeps it: time passes on the server', async () => {
    s = await server();
    const cookie = await signUp(s);
    const r = await command(cookie, 'req-start-1', { type: 'start', lane: 'gathering', action: pine });
    expect(JSON.parse(r.body)).toMatchObject({ result: { ok: true }, duplicate: false });
    s.clock.now += 75_000;
    expect((await state(cookie)).items['pine-logs']).toBe(10);
  });

  it('credits time away exactly as the engine does, up to the 24-hour cap', async () => {
    s = await server();
    const cookie = await signUp(s);
    const started = (
      JSON.parse((await command(cookie, 'req-start-2', { type: 'start', lane: 'gathering', action: pine })).body) as {
        state: State;
      }
    ).state;
    const T = s.clock.now;
    const engine = (hours: number) => s.ctx.engine.advance(started, T + hours * 3600_000, seeded(started.seed)).state;
    s.clock.now = T + 8 * 3600_000;
    const eight = await state(cookie);
    expect(eight).toEqual(engine(8));
    expect(eight.items['pine-logs']).toBeGreaterThan(3000);
    s.clock.now = T + 30 * 3600_000;
    expect((await state(cookie)).items).toEqual(engine(24).items);
  });

  it("says why a command was refused, and keeps one player's commands from another's", async () => {
    s = await server();
    const a = await signUp(s, 'Alder');
    const b = await signUp(s, 'Birch');
    const r = await command(a, 'req-old-pine', {
      type: 'start',
      lane: 'gathering',
      action: { feature: 'woodcutting', id: 'old-pine' },
    });
    expect(JSON.parse(r.body)).toMatchObject({
      result: { ok: false, reason: { code: 'levelTooLow', detail: { level: 5 } } },
    });
    await command(a, 'req-start-3', { type: 'start', lane: 'gathering', action: pine });
    expect((await state(b)).lanes.gathering.current).toBeNull();
  });

  it('keeps a switched-off feature from running', async () => {
    s = await server({ flags: { woodcutting: false, notes: false } });
    const cookie = await signUp(s);
    const r = await command(cookie, 'req-off-1', { type: 'start', lane: 'gathering', action: pine });
    expect(JSON.parse(r.body)).toMatchObject({ result: { ok: false, reason: { code: 'unavailable' } } });
    const f = await post(s, '/api/f/notes/add', { requestId: 'req-off-2', input: { text: 'x' } }, cookie);
    expect(code(f)).toBe('notFound');
  });

  it("runs a feature's own route, lighting the fire like any input", async () => {
    s = await server();
    const cookie = await signUp(s);
    const r = JSON.parse(
      (await post(s, '/api/f/notes/add', { requestId: 'req-note-1', input: { text: 'first' } }, cookie)).body,
    ) as {
      result: unknown;
      state: State;
    };
    expect(r.result).toEqual({ count: 1 });
    expect(r.state.features.notes).toEqual(['first']);
    expect(r.state.fireUntil).toBe(s.clock.now + 5 * 60_000);
  });

  it('limits commands to thirty in ten seconds', async () => {
    s = await server();
    const cookie = await signUp(s);
    for (let i = 0; i < 30; i++)
      expect((await command(cookie, `req-burst-${i}`, { type: 'stoke' })).statusCode).toBe(200);
    expect(code(await command(cookie, 'req-burst-30', { type: 'stoke' }))).toBe('tooManyTries');
  });

  it('needs a session for every game route', async () => {
    s = await server();
    expect(code(await s.app.inject({ method: 'GET', url: '/api/game' }))).toBe('notSignedIn');
    expect(code(await command('ic_session=forged-token-value', 'req-x-1', { type: 'stoke' }))).toBe('notSignedIn');
  });
});

describe('the live channel', () => {
  it("tells a player's open pages what changed, and no one else's", async () => {
    s = await server();
    await s.app.ready();
    const a = await signUp(s, 'Alder');
    const b = await signUp(s, 'Birch');
    const heard = { a: [] as LiveMessage[], b: [] as LiveMessage[] };
    const wa = await s.app.injectWS('/api/live', { headers: { cookie: a } });
    const wb = await s.app.injectWS('/api/live', { headers: { cookie: b } });
    wa.on('message', (m: Buffer) => heard.a.push(JSON.parse(m.toString()) as LiveMessage));
    wb.on('message', (m: Buffer) => heard.b.push(JSON.parse(m.toString()) as LiveMessage));
    await command(a, 'req-live-1', { type: 'start', lane: 'gathering', action: pine });
    await new Promise((r) => setTimeout(r, 50));
    expect(heard.a.map((m) => m.type)).toEqual(['state']);
    expect(heard.b).toEqual([]);
    wa.terminate();
    wb.terminate();
  });

  it('closes a page that is not signed in', async () => {
    s = await server();
    await s.app.ready();
    const ws = await s.app.injectWS('/api/live');
    const closed = await new Promise<number>((r) => ws.on('close', (c: number) => r(c)));
    expect(closed).toBe(4401);
  });
});

describe('telemetry', () => {
  it('records sessions and game events by player id, with no personal details', async () => {
    s = await server();
    const cookie = await signUp(s, 'Rowan');
    await command(cookie, 'req-tel-1', { type: 'start', lane: 'gathering', action: pine });
    await command(cookie, 'req-tel-2', { type: 'stop', lane: 'gathering' });
    const rows = s.ctx.db.select().from(telemetry).all();
    expect(rows.map((r) => r.type)).toEqual(['signUp', 'game.laneStopped']);
    expect(JSON.stringify(rows)).not.toContain('Rowan');
  });
});

describe('security', () => {
  it('sends the security headers with every answer', async () => {
    s = await server();
    const r = await s.app.inject({ method: 'GET', url: '/api/health' });
    expect(r.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['referrer-policy']).toBe('same-origin');
  });

  it('accepts changes from the site itself and refuses them from other sites', async () => {
    s = await server();
    const ok = await post(
      s,
      '/api/auth/sign-up',
      { name: 'Rowan', password: 'a long enough secret', ageConfirmed: true },
      undefined,
      { origin: ORIGIN },
    );
    expect(ok.statusCode).toBe(201);
    const cross = await post(s, '/api/auth/sign-in', { name: 'Rowan', password: 'x' }, undefined, {
      'sec-fetch-site': 'cross-site',
    });
    expect(code(cross)).toBe('forbiddenOrigin');
  });

  it('takes browser error reports, rate-limited', async () => {
    s = await server();
    const report = { message: 'x is not a function', url: '/skills' };
    for (let i = 0; i < 30; i++) expect((await post(s, '/api/errors', report)).statusCode).toBe(204);
    expect(code(await post(s, '/api/errors', report))).toBe('tooManyTries');
  });

  it('serves only the registered features (the fixture is extra)', () => {
    expect(FEATURES.map((f) => f.id)).not.toContain(notes.id);
  });
});
