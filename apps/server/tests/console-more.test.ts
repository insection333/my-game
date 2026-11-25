// The console's closer look at a player (session 234): notes admins keep for each other, kept in the log and
// gone with the account; the days they came, the browsers signed in, one of which can be signed out alone,
// and the notices sent them; and every row of the directory or the log at once, for a file.
import {
  DIRECTORY_PAGE,
  type ActivityResponse,
  type AuditResponse,
  type DirectoryResponse,
  type NoteResult,
  type RecordResponse,
} from '@idle-clash/contracts';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminNotes, players, visits } from '../src/db/schema.ts';
import { code, ORIGIN, post, server, signUp, signUpAdmin, type TestServer } from './helpers.ts';

const SECRET = 'console secret 1';
const PASSWORD = 'a long enough secret';
let s: TestServer;
afterEach(() => s?.close());

const call = (cookie: string, url: string, body: unknown) => post(s, url, body, cookie, { origin: ORIGIN });
const json = async <T>(cookie: string, url: string, body: unknown): Promise<T> => {
  const r = await call(cookie, url, body);
  if (r.statusCode >= 300) throw new Error(`${url}: ${r.statusCode} ${r.body}`);
  return JSON.parse(r.body) as T;
};
const idOf = (name: string) => s.ctx.db.select().from(players).where(eq(players.name, name)).get()!.id;
const me = async (cookie: string) =>
  (
    JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
      player: { name: string } | null;
    }
  ).player?.name ?? null;
const setup = async () => {
  s = await server({ staff: { name: 'Admin', password: SECRET } });
  const rowan = await signUp(s, 'Rowan');
  const r = await post(s, '/api/auth/sign-in', { name: 'Admin', password: SECRET }, undefined, { origin: ORIGIN });
  return { rowan, id: idOf('Rowan'), admin: String(r.headers['set-cookie']).split(';')[0] };
};

describe("the console's notes on a player", () => {
  it('keeps a note on the record and in the log, strikes it out, and lets it go with the account', async () => {
    const { id, admin } = await setup();
    const kept = await json<NoteResult>(admin, '/api/admin/note', {
      playerId: id,
      text: '  Asked about a lost sword. ',
    });
    expect(kept).toMatchObject({ ok: true, note: { actor: 'Admin', text: 'Asked about a lost sword.' } });
    // A double press keeps one.
    expect(await json(admin, '/api/admin/note', { playerId: id, text: 'Asked about a lost sword.' })).toEqual({
      ok: false,
      reason: 'repeated',
    });
    s.clock.now += 60_000;
    await json(admin, '/api/admin/note', { playerId: id, text: 'Gave it back.' });
    const record = await json<RecordResponse>(admin, '/api/admin/record', { playerId: id });
    expect(record.notes.map((n) => n.text)).toEqual(['Gave it back.', 'Asked about a lost sword.']);
    const noteId = record.notes[1].id;
    expect(code(await call(admin, '/api/admin/note/delete', { playerId: idOf('Admin'), noteId }))).toBe('notFound');
    expect((await call(admin, '/api/admin/note/delete', { playerId: id, noteId })).statusCode).toBe(204);
    expect(code(await call(admin, '/api/admin/note/delete', { playerId: id, noteId }))).toBe('notFound');
    const log = await json<AuditResponse>(admin, '/api/admin/audit', { query: 'sword', before: null });
    expect(log.entries.map((e) => [e.action, e.detail])).toEqual([
      ['unnote', { note: 'Asked about a lost sword.' }],
      ['note', { note: 'Asked about a lost sword.' }],
    ]);
    // Never on the console's own account, and never too short.
    expect(code(await call(admin, '/api/admin/note', { playerId: idOf('Admin'), text: 'A note' }))).toBe('notFound');
    expect(code(await call(admin, '/api/admin/note', { playerId: id, text: 'ok' }))).toBe('invalidInput');
    const rowan = id;
    expect((await call(admin, '/api/admin/delete', { playerId: rowan, name: 'Rowan' })).statusCode).toBe(204);
    expect(s.ctx.db.select().from(adminNotes).where(eq(adminNotes.playerId, rowan)).all()).toEqual([]);
  });

  it("keeps a deleted admin's notes, no longer naming them", async () => {
    const { id } = await setup();
    const wren = await signUpAdmin(s, 'Wren');
    await json(wren, '/api/admin/note', { playerId: id, text: 'Watch their fire.' });
    const hazel = await signUpAdmin(s, 'Hazel');
    expect((await call(hazel, '/api/admin/delete', { playerId: idOf('Wren'), name: 'Wren' })).statusCode).toBe(204);
    expect(s.ctx.db.select().from(adminNotes).all()).toMatchObject([{ actorName: '', text: 'Watch their fire.' }]);
  });
});

describe("the console's look at a player's activity", () => {
  it('says the days they came, the browsers signed in and the notices sent, and signs out one browser alone', async () => {
    const { rowan, id, admin } = await setup();
    const signed = await post(s, '/api/auth/sign-in', { name: 'Rowan', password: PASSWORD }, undefined, {
      origin: ORIGIN,
    });
    const second = String(signed.headers['set-cookie']).split(';')[0];
    const day = (n: number) => new Date(s.clock.now - n * 86_400_000).toISOString().slice(0, 10);
    for (const n of [1, 3, 83, 84, 200])
      s.ctx.db
        .insert(visits)
        .values({ playerId: id, day: day(n) })
        .onConflictDoNothing()
        .run();
    s.ctx.notices.add(id, [{ type: 'levelUp', at: s.clock.now, skill: 'woodcutting', level: 2 }]);
    const a = await json<ActivityResponse>(admin, '/api/admin/activity', { playerId: id });
    // Twelve weeks: the 83rd day before today is the first shown.
    expect(a.days).toContain(day(83));
    expect(a.days).not.toContain(day(84));
    expect(a.days).not.toContain(day(200));
    expect(a.sessions).toHaveLength(2);
    expect(a.sessions[0].handle).toMatch(/^[0-9a-f]{16}$/);
    expect(a.notices).toHaveLength(1);
    expect(a.notices[0].text).toMatch(/Woodcutting/);
    // One browser signed out: the other still plays.
    const before = [await me(rowan), await me(second)];
    expect(before).toEqual(['Rowan', 'Rowan']);
    const theirs = a.sessions.map((x) => x.handle);
    expect((await call(admin, '/api/admin/end-session', { playerId: id, handle: theirs[0] })).statusCode).toBe(204);
    const after = [await me(rowan), await me(second)];
    expect(after.filter((x) => x === 'Rowan')).toHaveLength(1);
    expect(code(await call(admin, '/api/admin/end-session', { playerId: id, handle: theirs[0] }))).toBe('notFound');
    // Another player's browser is not theirs to end by this one's record.
    const wren = await signUp(s, 'Wren');
    const wrens = await json<ActivityResponse>(admin, '/api/admin/activity', { playerId: idOf('Wren') });
    expect(code(await call(admin, '/api/admin/end-session', { playerId: id, handle: wrens.sessions[0].handle }))).toBe(
      'notFound',
    );
    expect(await me(wren)).toBe('Wren');
    const log = await json<AuditResponse>(admin, '/api/admin/audit', { query: '', before: null });
    expect(log.entries[0]).toMatchObject({ action: 'endSession', target: 'Rowan' });
  });
});

describe("the console's files", () => {
  it('reads the directory and the log for a file a thousand at a time', async () => {
    await setup();
    for (let i = 0; i < DIRECTORY_PAGE + 5; i++) {
      s.clock.now += 3_600_000;
      await signUp(s, `Player${i}`);
    }
    // The console's twelve hours have passed: sign in again.
    const again = await post(s, '/api/auth/sign-in', { name: 'Admin', password: SECRET }, undefined, {
      origin: ORIGIN,
    });
    const admin = String(again.headers['set-cookie']).split(';')[0];
    const page = await json<DirectoryResponse>(admin, '/api/admin/directory', {
      query: '',
      filter: 'all',
      sort: 'name',
      page: 0,
    });
    expect(page.rows).toHaveLength(DIRECTORY_PAGE);
    const file = await json<DirectoryResponse>(admin, '/api/admin/directory', {
      query: '',
      filter: 'all',
      sort: 'name',
      page: 0,
      file: true,
    });
    expect(file.rows).toHaveLength(DIRECTORY_PAGE + 6);
    expect(file.total).toBe(DIRECTORY_PAGE + 6);
    for (let i = 0; i < 105; i++) {
      s.clock.now += 3_000;
      await json(admin, '/api/admin/note', { playerId: idOf('Rowan'), text: `Note ${i}` });
    }
    const log = await json<AuditResponse>(admin, '/api/admin/audit', { query: '', before: null });
    expect(log.entries).toHaveLength(100);
    const every = await json<AuditResponse>(admin, '/api/admin/audit', { query: '', before: null, file: true });
    expect(every.entries).toHaveLength(105);
    expect(every.more).toBeNull();
  });
});

describe("the closed test's aims", () => {
  it('are read from a save once while it and the hour stand, and afresh once it changes', async () => {
    const { rowan, admin } = await setup();
    await s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie: rowan } });
    const read = vi.spyOn(s.ctx.store, 'read');
    // The saves a read of the page reads (a tester's total level is read from their save until they are on the
    // hiscores; their aims are the rest).
    const reads = async () => {
      const was = read.mock.calls.length;
      s.clock.now += 61_000;
      await json(admin, '/api/admin/test', '');
      return read.mock.calls.length - was;
    };
    const first = await reads();
    // A minute on, past the page's own minute: nothing of Rowan's has changed, so their aims are not read.
    expect(await reads()).toBe(first - 1);
    await post(s, '/api/game/command', { requestId: 'req-aims-1', command: { type: 'stoke' } }, rowan);
    expect(await reads()).toBe(first);
  });
});
