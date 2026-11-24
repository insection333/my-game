// The console's bug sweep (session 231): a double press gives once; the console's own account is no player to
// act on (a new password set on it from the console would hand it on); an admin cannot ban or delete
// themselves; a warning keeps the inbox to its newest; an admin's change is no act of the player's towards
// joining the hiscores; and the log is searched in the console's own words and by what changed.
import { MAIL } from '@idle-clash/contracts';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { players } from '../src/db/schema.ts';
import { REPEAT_MS } from '../src/admin/target.ts';
import { code, ORIGIN, post, server, signUp, signUpAdmin, type TestServer } from './helpers.ts';

const SECRET = 'console secret 1';
let s: TestServer;
afterEach(() => s?.close());

const call = (cookie: string, url: string, body: unknown) => post(s, url, body, cookie, { origin: ORIGIN });
const json = async <T>(cookie: string, url: string, body: unknown): Promise<T> => {
  const r = await call(cookie, url, body);
  if (r.statusCode >= 300) throw new Error(`${url}: ${r.statusCode} ${r.body}`);
  return JSON.parse(r.body) as T;
};
const idOf = (name: string) => s.ctx.db.select().from(players).where(eq(players.name, name)).get()!.id;
const setup = async () => {
  s = await server({ staff: { name: 'Admin', password: SECRET } });
  const rowan = await signUp(s, 'Rowan');
  const r = await post(s, '/api/auth/sign-in', { name: 'Admin', password: SECRET }, undefined, { origin: ORIGIN });
  return { rowan, id: idOf('Rowan'), admin: String(r.headers['set-cookie']).split(';')[0] };
};

describe("the console's sweep", () => {
  it('gives once for a double press, and again once a moment has passed', async () => {
    const { id, admin } = await setup();
    const grant = { playerId: id, item: 'oak-logs', count: 100, reason: 'Lost to a fault' };
    const [a, b] = await Promise.all([json(admin, '/api/admin/grant', grant), json(admin, '/api/admin/grant', grant)]);
    expect([a, b]).toContainEqual({ ok: false, reason: 'repeated' });
    expect(s.ctx.store.read(id, s.clock.now)!.doc.state.items['oak-logs']).toBe(100);
    const xp = { playerId: id, skill: 'mining', xp: 500, reason: 'Lost to a fault' };
    await json(admin, '/api/admin/xp', xp);
    expect(await json(admin, '/api/admin/xp', xp)).toEqual({ ok: false, reason: 'repeated' });
    s.clock.now += REPEAT_MS;
    expect(await json(admin, '/api/admin/grant', grant)).toEqual({ ok: true, held: 200 });
    const log = await json<{ entries: { action: string }[] }>(admin, '/api/admin/audit', { query: '', before: null });
    expect(log.entries.map((e) => e.action)).toEqual(['give', 'xp', 'give']);
  });

  it("refuses to act on the console's own account, and an admin on themselves", async () => {
    const { admin } = await setup();
    const staff = idOf('Admin');
    for (const [url, body] of [
      ['/api/admin/reset-password', { playerId: staff }],
      ['/api/admin/ban', { playerId: staff, banned: true }],
      ['/api/admin/rename', { playerId: staff, name: 'Steward' }],
      ['/api/admin/save', { playerId: staff }],
    ] as const)
      expect(code(await call(admin, url, body)), url).toBe('notFound');
    expect(s.ctx.db.select().from(players).where(eq(players.id, staff)).get()).toMatchObject({ bannedAt: null });
    const wren = await signUpAdmin(s, 'Wren');
    const me = idOf('Wren');
    expect(code(await call(wren, '/api/admin/ban', { playerId: me, banned: true }))).toBe('yourself');
    expect(code(await call(wren, '/api/admin/delete', { playerId: me, name: 'Wren' }))).toBe('yourself');
    expect(s.ctx.db.select().from(players).where(eq(players.id, me)).get()).toMatchObject({ bannedAt: null });
    // Nor is a warning sent to the console's account by its name.
    expect(code(await call(admin, '/api/admin/mail/action', { player: 'Admin', action: 'warn' }))).toBe('notFound');
  });

  it('keeps an inbox to its newest letters however many warnings come', async () => {
    const { id, admin } = await setup();
    for (let i = 0; i < MAIL.INBOX + 3; i++) {
      s.clock.now += 1000;
      expect((await call(admin, '/api/admin/mail/action', { player: 'Rowan', action: 'warn' })).statusCode).toBe(204);
    }
    const inbox = s.ctx.store.sqlite.prepare('select count(*) n from mail where to_id = ?').get(id) as { n: number };
    expect(inbox.n).toBe(MAIL.INBOX);
  });

  it("never counts an admin's change as the player's act towards the hiscores", async () => {
    const { rowan, id, admin } = await setup();
    await post(s, '/api/game/command', { requestId: 'req-sweep-1', command: { type: 'stoke' } }, rowan);
    s.clock.now += 3_600_000;
    await json(admin, '/api/admin/grant', { playerId: id, item: 'gold', count: 500, reason: 'A gift' });
    await json(admin, '/api/admin/xp', { playerId: id, skill: 'mining', xp: 500, reason: 'A gift' });
    expect(s.ctx.db.select().from(players).where(eq(players.id, id)).get()!.listedAt).toBeNull();
  });

  it('searches the log in the console’s words, by what changed, and takes % literally', async () => {
    const { id, admin } = await setup();
    await json(admin, '/api/admin/grant', { playerId: id, item: 'gold', count: 500, reason: 'Storm compensation' });
    await call(admin, '/api/admin/ban', { playerId: id, banned: true });
    const find = async (query: string) =>
      (await json<{ entries: { action: string }[] }>(admin, '/api/admin/audit', { query, before: null })).entries.map(
        (e) => e.action,
      );
    expect(await find('Gave')).toEqual(['give']);
    expect(await find('banned')).toEqual(['ban']);
    expect(await find('compensation')).toEqual(['give']);
    expect(await find('%')).toEqual([]);
  });
});
