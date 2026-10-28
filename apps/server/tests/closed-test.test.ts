// The closed test (session 18): with invites required, signing up takes an invite, each used once; any
// player can send feedback, which only admins read; the admin's panel tells who came back on their
// second and third days and what they are aiming for; and deleting an account takes its feedback and
// visits with it.
import type { AdminInviteResponse, AdminTestResponse } from '@idle-clash/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { code, post, server, signUp, signUpAdmin, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());

const DAY = 24 * 3_600_000;
const PASSWORD = 'a long enough secret';
const join = (name: string, invite?: string) =>
  post(s, '/api/auth/sign-up', { name, password: PASSWORD, ageConfirmed: true, ...(invite ? { invite } : {}) });
const panel = async (cookie: string) =>
  JSON.parse((await post(s, '/api/admin/test', '', cookie)).body) as AdminTestResponse;
const makeInvite = async (cookie: string) =>
  (JSON.parse((await post(s, '/api/admin/invite', '', cookie)).body) as AdminInviteResponse).code;

describe('the closed test', () => {
  it('takes an invite to sign up while invites are required, each once', async () => {
    s = await server();
    const admin = await signUpAdmin(s, 'Keeper');
    s.config.invitesRequired = true;
    const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me' })).body) as { invites: boolean };
    expect(me.invites).toBe(true);
    expect(code(await join('Ashling'))).toBe('inviteNeeded');
    expect(code(await join('Ashling', 'abcdefghjkmn'))).toBe('inviteUnknown');
    const invite = await makeInvite(admin);
    expect(invite).toMatch(/^[a-z2-9]{12}$/);
    expect((await join('Ashling', invite)).statusCode).toBe(201);
    expect(code(await join('Brindle', invite))).toBe('inviteUnknown');
    const p = await panel(admin);
    expect(p.invitesRequired).toBe(true);
    expect(p.invites[0]).toMatchObject({ code: invite, usedBy: 'Ashling' });
  });

  it('keeps the feedback players send for admins alone', async () => {
    s = await server();
    const admin = await signUpAdmin(s, 'Keeper');
    const player = await signUp(s, 'Ashling');
    const sent = await post(
      s,
      '/api/feedback',
      { text: 'Loved the forge.\nThe fen was hard.', page: '/skills/smithing' },
      player,
    );
    expect(sent.statusCode).toBe(204);
    expect(code(await post(s, '/api/feedback', { text: '   ', page: '/' }, player))).toBe('invalidInput');
    expect(code(await post(s, '/api/admin/test', '', player))).toBe('notAdmin');
    expect((await panel(admin)).feedback).toEqual([
      { name: 'Ashling', at: s.clock.now, page: '/skills/smithing', text: 'Loved the forge.\nThe fen was hard.' },
    ]);
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
    // The admin runs the test and is not one of its testers.
    expect(testers.map((t) => t.name)).not.toContain('Keeper');
    // A newcomer's Hearth asks for their first steps.
    expect(testers.find((t) => t.name === 'Ashling')?.aims.length).toBeGreaterThan(0);
  });

  it('takes a player’s feedback and visits with their account, and keeps their invite spent', async () => {
    s = await server();
    const admin = await signUpAdmin(s, 'Keeper');
    s.config.invitesRequired = true;
    const invite = await makeInvite(admin);
    const joined = await join('Ashling', invite);
    const cookie = String(joined.headers['set-cookie']).split(';')[0];
    const { id } = (JSON.parse(joined.body) as { player: { id: string } }).player;
    await s.app.inject({ method: 'GET', url: '/api/game', headers: { cookie } });
    await post(s, '/api/feedback', { text: 'Bye for now', page: '/' }, cookie);
    const gone = await post(s, '/api/account/delete', { password: PASSWORD, confirm: true }, cookie);
    expect(gone.statusCode).toBe(204);
    const p = await panel(admin);
    expect(p.feedback).toEqual([]);
    expect(p.invites[0]).toMatchObject({ code: invite, usedBy: null });
    expect(p.invites[0].usedAt).not.toBeNull();
    expect(code(await join('Brindle', invite))).toBe('inviteUnknown');
    const rows = s.ctx.store.sqlite.prepare('select * from visits').all() as { player_id: string }[];
    expect(rows.map((r) => r.player_id)).not.toContain(id);
  });
});
