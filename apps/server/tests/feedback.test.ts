// Feedback and the players' panel: any player can send feedback, which only admins read, held to a pace
// and a size so no one can flood it; the panel tells who came back on their second and third days and
// what they are aiming for; and deleting an account takes its feedback and visits with it. Signing up
// takes no invite: the game is shared with friends by word of mouth.
import type { AdminTestResponse } from '@idle-clash/contracts';
import { allSkills } from '@idle-clash/features';
import { afterEach, describe, expect, it } from 'vitest';
import { FEEDBACK_PACE } from '../src/feedback.ts';
import { code, post, server, signUp, signUpAdmin, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const DAY = 24 * 3_600_000;
const PASSWORD = 'a long enough secret';
const panel = async (cookie: string) =>
  JSON.parse((await post(s, '/api/admin/test', '', cookie)).body) as AdminTestResponse;
const send = (cookie: string, text: string) => post(s, '/api/feedback', { text, page: '/' }, cookie);
const stored = () => (s.ctx.store.sqlite.prepare('select count(*) as n from feedback').get() as { n: number }).n;

describe('feedback and the players’ panel', () => {
  it('signs up without an invite, and refuses one sent anyway', async () => {
    s = await server();
    const body = { name: 'Ashling', password: PASSWORD, ageConfirmed: true };
    expect(code(await post(s, '/api/auth/sign-up', { ...body, invite: 'abcdefghjkmn' }))).toBe('invalidInput');
    expect((await post(s, '/api/auth/sign-up', body)).statusCode).toBe(201);
    expect(code(await post(s, '/api/admin/invite', ''))).toBe('notFound');
  });

  it('keeps the feedback players send for admins alone, with where they stand', async () => {
    s = await server();
    const admin = await signUpAdmin(s, 'Keeper');
    const player = await signUp(s, 'Ashling');
    await s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie: player } });
    const sent = await post(
      s,
      '/api/feedback',
      { text: 'Loved the forge.\nThe fen was hard.', page: '/skills/smithing' },
      player,
    );
    expect(sent.statusCode).toBe(204);
    expect(code(await send(player, '   '))).toBe('invalidInput');
    expect(code(await post(s, '/api/admin/test', '', player))).toBe('notAdmin');
    expect((await panel(admin)).feedback).toEqual([
      {
        name: 'Ashling',
        at: s.clock.now,
        page: '/skills/smithing',
        text: 'Loved the forge.\nThe fen was hard.',
        totalLevel: expect.any(Number) as number,
        daysPlayed: 1,
      },
    ]);
  });

  it('gives a player’s true total level, even before their first look at the game', async () => {
    s = await server();
    const admin = await signUpAdmin(s, 'Keeper');
    const player = await signUp(s, 'Ashling');
    await send(player, 'Straight to feedback');
    const newcomer = allSkills().length;
    expect((await panel(admin)).feedback[0].totalLevel).toBe(newcomer);
    expect((await panel(admin)).testers.find((t) => t.name === 'Ashling')?.totalLevel).toBe(newcomer);
    const found = JSON.parse((await post(s, '/api/admin/players', { query: 'Ashling' }, admin)).body) as {
      players: { totalLevel: number }[];
    };
    expect(found.players[0].totalLevel).toBe(newcomer);
  });

  it('keeps the same words sent twice once', async () => {
    s = await server();
    const player = await signUp(s, 'Ashling');
    expect((await send(player, 'The forge tab is hard to find')).statusCode).toBe(204);
    expect((await send(player, 'The forge tab is hard to find')).statusCode).toBe(204);
    expect(stored()).toBe(1);
  });

  it('holds feedback to ten an hour and thirty a day', async () => {
    s = await server();
    const player = await signUp(s, 'Ashling');
    let n = 0;
    for (let i = 0; i < FEEDBACK_PACE.hour; i++) expect((await send(player, `note ${n++}`)).statusCode).toBe(204);
    expect(code(await send(player, `note ${n++}`))).toBe('tooManyTries');
    // Hour after hour, the day's limit holds.
    for (let h = 1; h < 3; h++) {
      s.clock.now += 3_600_000;
      for (let i = 0; i < FEEDBACK_PACE.hour; i++) await send(player, `note ${n++}`);
    }
    s.clock.now += 3_600_000;
    expect(code(await send(player, `note ${n}`))).toBe('tooManyTries');
    expect(stored()).toBe(FEEDBACK_PACE.day);
  });

  it('keeps only a player’s newest fifty', async () => {
    s = await server();
    const player = await signUp(s, 'Ashling');
    for (let d = 0; d < 2; d++) {
      for (let i = 0; i < FEEDBACK_PACE.day; i++) {
        if (i % FEEDBACK_PACE.hour === 0) s.clock.now += 3_600_000;
        await send(player, `day ${d} note ${i}`);
      }
      s.clock.now += DAY;
    }
    expect(stored()).toBe(FEEDBACK_PACE.kept);
    const oldest = s.ctx.store.sqlite.prepare('select text from feedback order by id limit 1').get() as {
      text: string;
    };
    expect(oldest.text).toBe('day 0 note 10');
  });

  it('tells who came back on their second and third days, and what they are aiming for', async () => {
    s = await server();
    const admin = await signUpAdmin(s, 'Keeper');
    const back = await signUp(s, 'Ashling');
    await signUp(s, 'Brindle');
    // On the day they joined, their second and third days are still to come.
    expect((await panel(admin)).testers.find((t) => t.name === 'Brindle')).toMatchObject({ day2: null, day3: null });
    const visit = (cookie: string) => s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie } });
    await visit(back);
    s.clock.now += DAY;
    await visit(back);
    s.clock.now += DAY;
    await visit(back);
    const testers = (await panel(admin)).testers;
    expect(testers.find((t) => t.name === 'Ashling')).toMatchObject({ daysPlayed: 3, day2: true, day3: true });
    expect(testers.find((t) => t.name === 'Brindle')).toMatchObject({ day2: false, day3: false });
    // The admin is not one of the players.
    expect(testers.map((t) => t.name)).not.toContain('Keeper');
    // A newcomer's Hearth asks for their first steps.
    expect(testers.find((t) => t.name === 'Ashling')?.aims.length).toBeGreaterThan(0);
  });

  it('takes a player’s feedback and visits with their account', async () => {
    s = await server();
    const admin = await signUpAdmin(s, 'Keeper');
    const joined = await post(s, '/api/auth/sign-up', { name: 'Ashling', password: PASSWORD, ageConfirmed: true });
    const cookie = String(joined.headers['set-cookie']).split(';')[0];
    const { id } = (JSON.parse(joined.body) as { player: { id: string } }).player;
    await s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie } });
    await send(cookie, 'Bye for now');
    const gone = await post(s, '/api/account/delete', { password: PASSWORD, confirm: true }, cookie);
    expect(gone.statusCode).toBe(204);
    expect((await panel(admin)).feedback).toEqual([]);
    const rows = s.ctx.store.sqlite.prepare('select * from visits').all() as { player_id: string }[];
    expect(rows.map((r) => r.player_id)).not.toContain(id);
  });
});
