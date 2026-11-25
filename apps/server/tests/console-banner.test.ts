// The realm's banner (session 235): put up from the console, it is read with the game and told at once to
// every page open; it goes by itself once its time runs out, or when taken down; it stands across a restart;
// and each put up or taken down is in the Audit log. Only admins put one up, and only for the hours offered.
import type { AuditResponse, Banner, GameResponse, LiveMessage } from '@idle-clash/contracts';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { players } from '../src/db/schema.ts';
import { code, ORIGIN, post, server, signUp, type TestServer } from './helpers.ts';

const SECRET = 'console secret 1';
const HOUR = 3_600_000;
let s: TestServer;
afterEach(() => s?.close());

const call = (cookie: string, url: string, body: unknown) => post(s, url, body, cookie, { origin: ORIGIN });
const staffIn = async () => {
  const r = await post(s, '/api/auth/sign-in', { name: 'Admin', password: SECRET }, undefined, { origin: ORIGIN });
  return String(r.headers['set-cookie']).split(';')[0];
};
const bannerOf = async (cookie: string) =>
  (JSON.parse((await s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie } })).body) as GameResponse)
    .banner;
const TEXT = 'The realm rests from 22:00 to 22:30 UTC tonight while the keepers mend the roads.';

describe("the realm's banner", () => {
  it('is read with the game, told to every open page, and goes when its time runs out', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const rowan = await signUp(s, 'Rowan');
    const admin = await staffIn();
    expect(await bannerOf(rowan)).toBeNull();
    const heard: LiveMessage[] = [];
    const id = s.ctx.db.select().from(players).where(eq(players.name, 'Rowan')).get()!.id;
    s.ctx.live.add(id, {
      readyState: 1,
      send: (m: string) => void heard.push(JSON.parse(m) as LiveMessage),
      close: () => undefined,
    });
    const put = await call(admin, '/api/admin/banner', { text: `  ${TEXT} `, hours: 6 });
    expect(put.statusCode).toBe(200);
    const banner: Banner = { id: s.clock.now, text: TEXT, until: s.clock.now + 6 * HOUR };
    expect(heard).toEqual([{ type: 'banner', banner }]);
    expect(await bannerOf(rowan)).toEqual(banner);
    // Put up again a moment later: a new banner, shown afresh to players who put the last away.
    const again = JSON.parse((await call(admin, '/api/admin/banner', { text: TEXT, hours: 1 })).body) as Banner;
    expect(again.id).toBeGreaterThan(banner.id);
    s.clock.now += HOUR;
    expect(await bannerOf(rowan)).toBeNull();
    // Taking down a banner whose time has run out changes nothing and logs nothing.
    expect((await call(admin, '/api/admin/banner/down', '')).statusCode).toBe(204);
    const log = JSON.parse((await call(admin, '/api/admin/audit', { query: '', before: null })).body) as AuditResponse;
    expect(log.entries.map((e) => [e.action, e.detail])).toEqual([
      ['banner', { text: TEXT, hours: 1 }],
      ['banner', { text: TEXT, hours: 6 }],
    ]);
  });

  it('is taken down from every page, and stands across a restart until then', async () => {
    const dbPath = join(mkdtempSync(join(tmpdir(), 'ic-banner-')), 'banner.db');
    s = await server({ dbPath, staff: { name: 'Admin', password: SECRET } });
    const rowan = await signUp(s, 'Rowan');
    await call(await staffIn(), '/api/admin/banner', { text: TEXT, hours: 24 });
    const at = s.clock.now;
    await s.close();
    s = await server({ dbPath, staff: { name: 'Admin', password: SECRET } });
    s.clock.now = at + HOUR;
    expect(await bannerOf(rowan)).toMatchObject({ text: TEXT, until: at + 24 * HOUR });
    const admin = await staffIn();
    const heard: LiveMessage[] = [];
    const id = s.ctx.db.select().from(players).where(eq(players.name, 'Rowan')).get()!.id;
    s.ctx.live.add(id, {
      readyState: 1,
      send: (m: string) => void heard.push(JSON.parse(m) as LiveMessage),
      close: () => undefined,
    });
    expect((await call(admin, '/api/admin/banner/down', '')).statusCode).toBe(204);
    expect(heard).toEqual([{ type: 'banner', banner: null }]);
    expect(await bannerOf(rowan)).toBeNull();
    const live = JSON.parse((await call(admin, '/api/admin/live', '')).body) as { banner: unknown };
    expect(live.banner).toBeNull();
  });

  it('is put up only by an admin, for the hours offered, with a line long enough to read', async () => {
    s = await server({ staff: { name: 'Admin', password: SECRET } });
    const rowan = await signUp(s, 'Rowan');
    const admin = await staffIn();
    expect((await call(rowan, '/api/admin/banner', { text: TEXT, hours: 6 })).statusCode).toBe(403);
    expect(code(await call(admin, '/api/admin/banner', { text: TEXT, hours: 2 }))).toBe('invalidInput');
    expect(code(await call(admin, '/api/admin/banner', { text: 'Hi all', hours: 6 }))).toBe('invalidInput');
    expect(code(await call(admin, '/api/admin/banner', { text: 'x'.repeat(201), hours: 6 }))).toBe('invalidInput');
    expect(await bannerOf(rowan)).toBeNull();
  });
});
