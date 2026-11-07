// Letters (session 45): plain text of 250 characters at most reaches a player's inbox, which keeps its
// newest 20; foul language is refused, kept for the admin and flags the sender's letters that day; a block
// stops letters (and only letters) until it is lifted; a sender waits between letters and writes to ten
// players a day at most; read letters go after 7 days and unread after 14; an admin sees all of it and
// warns or mutes; and none of it outlives an account.
import type { AdminMailResponse, InboxResponse, SendResult } from '@idle-clash/contracts';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { mail, mailBlocks, mailRefused, players } from '../src/db/schema.ts';
import { keepHouse } from '../src/housekeeping.ts';
import { post, server, signUp, signUpAdmin, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const DAY = 86_400_000;
const sendAs = async (cookie: string, to: string, body: string) => {
  const r = await post(s, '/api/mail/send', { to, body }, cookie);
  return JSON.parse(r.body) as SendResult;
};
const inboxOf = async (cookie: string) => JSON.parse((await post(s, '/api/mail', '', cookie)).body) as InboxResponse;
const later = (ms = 16_000) => (s.clock.now += ms);

describe('sending a letter', () => {
  it('lands in the inbox as plain text, unread until the inbox is opened', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    const birch = await signUp(s, 'Birch');
    expect(await sendAs(alder, 'birch', ' Well <b>fought</b>\n at the walls ')).toEqual({ ok: true });
    const box = await inboxOf(birch);
    expect(box.letters).toMatchObject([{ from: 'Alder', body: 'Well fought at the walls', read: false }]);
    expect(box.unread).toBe(1);
    await post(s, '/api/mail/read', '', birch);
    expect((await inboxOf(birch)).unread).toBe(0);
  });

  it('refuses nothing to say, too much to say, and a letter to oneself or to no one', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    await signUp(s, 'Birch');
    expect(await sendAs(alder, 'Birch', '<i></i>   ')).toEqual({ ok: false, reason: 'empty' });
    expect(await sendAs(alder, 'Birch', 'a'.repeat(251))).toEqual({ ok: false, reason: 'tooLong' });
    expect(await sendAs(alder, 'Birch', 'a'.repeat(250))).toEqual({ ok: true });
    later();
    expect(await sendAs(alder, 'Alder', 'hello me')).toEqual({ ok: false, reason: 'self' });
    expect(await sendAs(alder, 'Nobody', 'hello')).toEqual({ ok: false, reason: 'noPlayer' });
    s.ctx.db.update(players).set({ bannedAt: s.clock.now }).where(eq(players.name, 'Birch')).run();
    expect(await sendAs(alder, 'Birch', 'hello')).toEqual({ ok: false, reason: 'blocked' });
  });

  it('refuses foul language however it is spelled, keeps it for the admin and flags the next letters', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    const birch = await signUp(s, 'Birch');
    for (const bad of ['you f u c k', 'sh1t castle', 'fuuuuck off', 'what a tw@t'])
      expect(await sendAs(alder, 'Birch', bad)).toEqual({ ok: false, reason: 'language' });
    expect(s.ctx.db.select().from(mailRefused).all()).toHaveLength(4);
    expect(await sendAs(alder, 'Birch', 'Scunthorpe is lovely, the class hit it off')).toEqual({ ok: true });
    expect(s.ctx.db.select().from(mail).get()!.flagged).toBe(1);
    expect((await inboxOf(birch)).letters).toHaveLength(1);
  });

  it('waits between letters, and writes to ten players a day at most', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    // Readers made straight in the table: sign-ups from one address are limited by the hour.
    const names = Array.from({ length: 11 }, (_, i) => `Reader${String.fromCharCode(97 + i)}`);
    for (const n of names)
      s.ctx.db
        .insert(players)
        .values({
          id: crypto.randomUUID(),
          name: n,
          nameKey: n.toLowerCase(),
          nameLook: n,
          passwordHash: 'x',
          createdAt: 0,
        })
        .run();
    expect(await sendAs(alder, names[0], 'one')).toEqual({ ok: true });
    expect(await sendAs(alder, names[0], 'two')).toEqual({ ok: false, reason: 'cooldown' });
    for (const n of names.slice(1, 10)) {
      later();
      expect(await sendAs(alder, n, 'hello')).toEqual({ ok: true });
    }
    later();
    expect(await sendAs(alder, names[10], 'hello')).toEqual({ ok: false, reason: 'tooManyPlayers' });
    // One already written to today may be written to again.
    expect(await sendAs(alder, names[3], 'again')).toEqual({ ok: true });
  });
});

describe('the inbox', () => {
  it('keeps the newest 20, the oldest going first', async () => {
    s = await server();
    const birch = await signUp(s, 'Birch');
    const senders = await Promise.all(Array.from({ length: 3 }, (_, i) => signUp(s, `Writer${'abc'[i]}`)));
    for (let i = 0; i < 22; i++) {
      later();
      expect(await sendAs(senders[i % 3], 'Birch', `letter ${i}`)).toEqual({ ok: true });
    }
    const box = await inboxOf(birch);
    expect(box.letters).toHaveLength(20);
    expect(box.letters.at(-1)!.body).toBe('letter 2');
    expect(box.letters[0].body).toBe('letter 21');
  });

  it('lets read letters go after 7 days and unread after 14', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    const birch = await signUp(s, 'Birch');
    await sendAs(alder, 'Birch', 'read me');
    await post(s, '/api/mail/read', '', birch);
    later();
    await sendAs(alder, 'Birch', 'unread');
    s.clock.now += 8 * DAY;
    keepHouse(s.ctx);
    expect((await inboxOf(birch)).letters.map((l) => l.body)).toEqual(['unread']);
    s.clock.now += 7 * DAY;
    keepHouse(s.ctx);
    expect((await inboxOf(birch)).letters).toEqual([]);
  });

  it('gives a letter read late its full week from the reading', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    const birch = await signUp(s, 'Birch');
    await sendAs(alder, 'Birch', 'read on day 13');
    s.clock.now += 13 * DAY;
    await post(s, '/api/mail/read', '', birch);
    s.clock.now += 3 * DAY;
    keepHouse(s.ctx);
    expect((await inboxOf(birch)).letters.map((l) => l.body)).toEqual(['read on day 13']);
  });

  it('blocks a player from writing, and only from writing, until they are unblocked', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    const birch = await signUp(s, 'Birch');
    await sendAs(alder, 'Birch', 'hello');
    const after = JSON.parse(
      (await post(s, '/api/mail/block', { name: 'alder', blocked: true }, birch)).body,
    ) as InboxResponse;
    expect(after.blocked).toEqual(['Alder']);
    expect(after.letters).toEqual([]);
    later();
    expect(await sendAs(alder, 'Birch', 'hello again')).toEqual({ ok: false, reason: 'blocked' });
    // Birch may still write to Alder: a block is one way.
    expect(await sendAs(birch, 'Alder', 'not you')).toEqual({ ok: true });
    await post(s, '/api/mail/block', { name: 'Alder', blocked: false }, birch);
    later();
    expect(await sendAs(alder, 'Birch', 'friends?')).toEqual({ ok: true });
    expect((await inboxOf(birch)).blocked).toEqual([]);
  });
});

describe("the admin's monitor", () => {
  it('shows letters, refused letters and who keeps trying, and warns and mutes', async () => {
    s = await server();
    const admin = await signUpAdmin(s, 'Warden');
    const alder = await signUp(s, 'Alder');
    const birch = await signUp(s, 'Birch');
    await sendAs(alder, 'Birch', 'shit');
    await sendAs(alder, 'Birch', 'hello there');
    const view = JSON.parse(
      (await post(s, '/api/admin/mail', { player: 'Alder', flagged: false }, admin)).body,
    ) as AdminMailResponse;
    expect(view.letters).toMatchObject([{ from: 'Alder', to: 'Birch', body: 'hello there', flagged: true }]);
    expect(view.refused).toMatchObject([{ from: 'Alder', body: 'shit' }]);
    expect(view.watch).toMatchObject([{ name: 'Alder', refused: 1, muted: false }]);
    expect((await post(s, '/api/admin/mail', { flagged: false }, alder)).statusCode).toBe(403);
    await post(s, '/api/admin/mail/action', { player: 'Alder', action: 'warn' }, admin);
    // The warning is the game's own letter: it names no admin.
    expect((await inboxOf(alder)).letters[0]).toMatchObject({ from: '', realm: true, look: null });
    await post(s, '/api/admin/mail/action', { player: 'Alder', action: 'mute' }, admin);
    later();
    expect(await sendAs(alder, 'Birch', 'hi')).toEqual({ ok: false, reason: 'muted' });
    expect((await inboxOf(alder)).mutedUntil).toBeGreaterThan(s.clock.now);
    await post(s, '/api/admin/mail/action', { player: 'Alder', action: 'unmute' }, admin);
    expect(await sendAs(alder, 'Birch', 'hi')).toEqual({ ok: true });
    expect((await inboxOf(birch)).letters).toHaveLength(2);
  });
});

describe('an account deleted', () => {
  it('takes every letter to and from it, its blocks and its refused letters', async () => {
    s = await server();
    const alder = await signUp(s, 'Alder');
    const birch = await signUp(s, 'Birch');
    await sendAs(alder, 'Birch', 'hello');
    await sendAs(alder, 'Birch', 'shit');
    await post(s, '/api/mail/block', { name: 'Alder', blocked: true }, birch);
    await post(s, '/api/account/delete', { password: 'a long enough secret', confirm: true }, alder);
    expect(s.ctx.db.select().from(mail).all()).toEqual([]);
    expect(s.ctx.db.select().from(mailRefused).all()).toEqual([]);
    expect(s.ctx.db.select().from(mailBlocks).where(eq(mailBlocks.blockerId, 'x')).all()).toEqual([]);
    expect(s.ctx.db.select().from(mailBlocks).all()).toEqual([]);
  });
});
