// What one player, or a stranger, could do to spoil the game for others, and why they cannot: lock a
// player out by guessing at their name, fill the hiscores with accounts, pass for another player with
// a look-alike name, open pages without end, read without pause, or leave the server's tables to grow
// for ever.
import { nameLook } from '@idle-clash/contracts';
import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { afterEach, describe, expect, it } from 'vitest';
import { configFromEnv } from '../src/config.ts';
import { sessions, telemetry } from '../src/db/schema.ts';
import { LiveHub, PAGES_PER_PLAYER } from '../src/game/live.ts';
import { keepHouse, SESSIONS_PER_PLAYER, TELEMETRY_DAYS } from '../src/housekeeping.ts';
import { code, post, server, signUp, signUpAdmin, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const PW = 'a long enough secret';
const DAY = 24 * 3_600_000;
const from = (ip: string, url: string, body: unknown, cookie?: string) =>
  s.app.inject({
    method: 'POST',
    url,
    remoteAddress: ip,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    payload: JSON.stringify(body),
  });
const signIn = (ip: string, name: string, password: string) => from(ip, '/api/auth/sign-in', { name, password });
const join = (ip: string, name: string) => from(ip, '/api/auth/sign-up', { name, password: PW, ageConfirmed: true });

describe('no one can lock a player out', () => {
  it('lets a player sign in while a stranger guesses at their name from elsewhere', async () => {
    s = await server();
    await signUp(s, 'Ashling');
    for (let i = 0; i < 20; i++) await signIn('203.0.113.9', 'Ashling', `wrong guess ${i}`);
    expect(code(await signIn('203.0.113.9', 'Ashling', 'wrong again'))).toBe('tooManyTries');
    expect((await signIn('198.51.100.4', 'Ashling', PW)).statusCode).toBe(200);
  });
});

describe('accounts', () => {
  it('are made at a pace across the whole server, however many addresses ask', async () => {
    s = await server({ signUpsPerHour: 3 });
    for (let i = 0; i < 3; i++) expect((await join(`203.0.113.${i + 1}`, `Player ${i}`)).statusCode).toBe(201);
    expect(code(await join('203.0.113.50', 'Player x'))).toBe('tooManyTries');
    s.clock.now += 3_600_000;
    expect((await join('203.0.113.51', 'Player y')).statusCode).toBe(201);
  });

  it('cannot take a name that looks like another player’s', async () => {
    s = await server();
    await signUp(s, 'Ashling');
    for (const [i, name] of ['AshIing', 'Ash1ing', 'Ash_ling', 'Ash-ling', 'ASHLING'].entries())
      expect(code(await join(`203.0.113.${i + 1}`, name))).toBe('nameTaken');
    expect(code(await join('203.0.113.9', 'Rnorwen'))).toBeUndefined();
    expect(code(await join('203.0.113.10', 'Morwen'))).toBe('nameTaken');
  });

  it('cannot be renamed into a look-alike of another player', async () => {
    s = await server();
    const admin = await signUpAdmin(s, 'Keeper');
    await signUp(s, 'Ashling');
    const other = await post(s, '/api/auth/sign-up', { name: 'Brindle', password: PW, ageConfirmed: true });
    const { id } = (JSON.parse(other.body) as { player: { id: string } }).player;
    expect(code(await post(s, '/api/admin/rename', { playerId: id, name: 'AshIing' }, admin))).toBe('nameTaken');
    // A player may still be renamed into a look-alike of their own name.
    expect((await post(s, '/api/admin/rename', { playerId: id, name: 'BrindIe' }, admin)).statusCode).toBe(200);
  });
});

describe('the paces', () => {
  it('are never lifted by a mistyped setting', () => {
    for (const bad of ['', 'lots', '0', '-5', '2.5', 'Infinity'])
      expect(configFromEnv({ SIGNUPS_PER_HOUR: bad, READS_PER_MINUTE: bad, PAGES_PER_MINUTE: bad })).toMatchObject({
        signUpsPerHour: 30,
        readsPerMinute: 120,
        pagesPerMinute: 20,
      });
    expect(configFromEnv({ SIGNUPS_PER_HOUR: '500' }).signUpsPerHour).toBe(500);
  });
});

describe('how a name looks', () => {
  it('is worked out by the migration exactly as the server works it out', async () => {
    s = await server();
    const sql = readFileSync(new URL('../migrations/0004_session19.sql', import.meta.url), 'utf8');
    const expr = /SET `name_look` = (.+);--> statement-breakpoint/.exec(sql)![1].replace('`name`', '?');
    const look = s.ctx.store.sqlite.prepare(`select ${expr} as look`);
    fc.assert(
      fc.property(fc.stringMatching(/^[A-Za-z0-9 _-]{3,16}$/), (name) => {
        expect((look.get(name) as { look: string }).look).toBe(nameLook(name));
      }),
      { numRuns: 500 },
    );
  });
});

describe('pages and reads', () => {
  it('keeps a player’s newest open pages, closing the oldest', () => {
    const hub = new LiveHub();
    const closed: number[] = [];
    const page = (n: number) => ({ readyState: 1, send: () => undefined, close: () => void closed.push(n) });
    for (let i = 0; i < PAGES_PER_PLAYER + 3; i++) hub.add('p', page(i));
    expect(closed).toEqual([0, 1, 2]);
    expect(hub.online).toBe(1);
  });

  it('refuses a stream of new pages from one address', async () => {
    s = await server();
    await s.app.ready();
    const cookie = await signUp(s, 'Ashling');
    const open = () =>
      s.app.injectWS('/api/live', { headers: { cookie } }).then(
        (ws) => (ws.terminate(), 'open'),
        (err: unknown) => String(err),
      );
    const results = [];
    for (let i = 0; i < 40; i++) results.push(await open());
    expect(results.filter((r) => r === 'open').length).toBeLessThan(40);
    expect(results.at(-1)).toMatch(/429/);
  });

  it('holds a player’s reads to a pace', async () => {
    s = await server();
    const cookie = await signUp(s, 'Ashling');
    const read = () => s.app.inject({ method: 'GET', url: '/api/hiscores', headers: { cookie } });
    let last = 0;
    for (let i = 0; i < 200 && last !== 429; i++) last = (await read()).statusCode;
    expect(last).toBe(429);
    s.clock.now += 60_000;
    expect((await read()).statusCode).toBe(200);
  });
});

describe('the server’s tables', () => {
  it('keep a player’s newest sessions only', async () => {
    s = await server();
    await signUp(s, 'Ashling');
    for (let i = 0; i < SESSIONS_PER_PLAYER + 5; i++) {
      expect((await signIn(`203.0.113.${i + 1}`, 'Ashling', PW)).statusCode).toBe(200);
    }
    expect(s.ctx.db.select().from(sessions).all()).toHaveLength(SESSIONS_PER_PLAYER);
  });

  it('let go of ended sessions and old telemetry', async () => {
    s = await server();
    await signUp(s, 'Ashling');
    s.clock.now += (TELEMETRY_DAYS + 1) * DAY;
    const fresh = await signUp(s, 'Brindle');
    keepHouse(s.ctx);
    const left = s.ctx.db.select().from(sessions).all();
    expect(left).toHaveLength(1);
    expect(
      s.ctx.db
        .select()
        .from(telemetry)
        .all()
        .map((r) => r.type),
    ).toEqual(['signUp']);
    expect((await s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie: fresh } })).statusCode).toBe(200);
  });
});
