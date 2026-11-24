// The console's live operations and system (session 230): who is playing now and who joined last; a letter
// to every player not banned, as the game's own, only to the count the admin was shown, each inbox keeping
// its newest, and logged; and the server's state, with the browser errors of the last day by player.
import { afterEach, describe, expect, it } from 'vitest';
import { code, ORIGIN, post, server, signUp, type TestServer } from './helpers.ts';

const SECRET = 'console secret 1';
let s: TestServer;
afterEach(() => s?.close());

const call = (cookie: string, url: string, body: unknown) => post(s, url, body, cookie, { origin: ORIGIN });
const json = async <T>(cookie: string, url: string, body: unknown = ''): Promise<T> => {
  const r = await call(cookie, url, body);
  if (r.statusCode >= 300) throw new Error(`${url}: ${r.statusCode} ${r.body}`);
  return JSON.parse(r.body) as T;
};
const setup = async () => {
  s = await server({ staff: { name: 'Admin', password: SECRET } });
  const players = [await signUp(s, 'Alder'), await signUp(s, 'Birch'), await signUp(s, 'Cedar')];
  const r = await post(s, '/api/auth/sign-in', { name: 'Admin', password: SECRET }, undefined, { origin: ORIGIN });
  return { players, admin: String(r.headers['set-cookie']).split(';')[0] };
};
const inboxOf = async (cookie: string) => json<{ letters: { body: string; realm: boolean }[] }>(cookie, '/api/mail');

describe("the console's live operations", () => {
  it('says who joined last, and sends a letter to every player not banned, as the game', async () => {
    const { players, admin } = await setup();
    const me = (await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie: players[1] } })).body;
    const birch = (JSON.parse(me) as { player: { id: string } }).player.id;
    await json(admin, '/api/admin/ban', { playerId: birch, banned: true });
    const live = await json<{ joined: { name: string }[]; reach: number }>(admin, '/api/admin/live');
    expect(live.joined.map((p) => p.name).sort()).toEqual(['Alder', 'Birch', 'Cedar']);
    expect(live.reach).toBe(2);
    const text = 'The realm rests for an hour tonight while the roads are mended.';
    // Sent to the count the admin saw, or asked again.
    expect(await json(admin, '/api/admin/broadcast', { text, to: 3 })).toEqual({
      ok: false,
      reason: 'reachChanged',
      reach: 2,
    });
    expect(await json(admin, '/api/admin/broadcast', { text, to: 2 })).toEqual({ ok: true, count: 2 });
    const alder = await inboxOf(players[0]);
    expect(alder.letters[0]).toMatchObject({ body: text, realm: true });
    const sent = (await json<{ sent: { count: number; text: string; actor: string }[] }>(admin, '/api/admin/live'))
      .sent;
    expect(sent).toEqual([expect.objectContaining({ count: 2, text, actor: 'Admin' })]);
    expect(code(await call(players[0], '/api/admin/broadcast', { text, to: 2 }))).toBe('notAdmin');
  });

  it('keeps each inbox to its newest, a letter to everyone among them', async () => {
    const { players, admin } = await setup();
    for (let i = 0; i < 22; i++) {
      await json(admin, '/api/admin/broadcast', { text: `Letter number ${i} to the realm.`, to: 3 });
      s.clock.now += 1000;
    }
    const letters = (await inboxOf(players[2])).letters;
    expect(letters).toHaveLength(20);
    expect(letters[0].body).toBe('Letter number 21 to the realm.');
  });
});

describe("the console's system", () => {
  it('says the features, the tables and the browser errors of the last day by player', async () => {
    const { players, admin } = await setup();
    await call(players[0], '/api/errors', {
      message: 'Boom at the forge',
      url: 'http://localhost:3000/skills/smithing',
    });
    const sys = await json<{
      features: { id: string; on: boolean }[];
      tables: { name: string; rows: number }[];
      errors: { player: string | null; message: string }[];
    }>(admin, '/api/admin/system');
    expect(sys.features.find((f) => f.id === 'woodcutting')).toEqual({ id: 'woodcutting', on: true });
    expect(sys.tables.find((x) => x.name === 'players')?.rows).toBe(4);
    expect(sys.errors).toEqual([expect.objectContaining({ player: 'Alder', message: 'Boom at the forge' })]);
  });
});
