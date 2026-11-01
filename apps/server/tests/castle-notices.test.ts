// Castle Clash's news (DESIGN.md section 9): a lord besieged, or whose castle caught a spy, hears of it in
// their notices tray (and on open pages through the live channel), by the attacker's name; the attacker
// hears how their siege ended. Telemetry keeps the event without the name.
import { XP_TABLE } from '@idle-clash/content';
import { allSkills, castleEngine as E } from '@idle-clash/features';
import type { GameEvent } from '@idle-clash/kernel';
import { describe, expect, it, vi } from 'vitest';
import { erase } from '../src/auth/account.ts';
import { CastleStore } from '../src/castle/store.ts';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
interface Lord {
  cookie: string;
  id: string;
}

async function lord(name: string, level: number, gold: number): Promise<Lord> {
  const cookie = await signUp(s, name);
  const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
    player: { id: string };
  };
  const saved = s.ctx.store.read(me.player.id, s.clock.now)!;
  const skills = Object.fromEntries(allSkills().map((k) => [k, { xp: XP_TABLE[level] }]));
  const state = { ...saved.doc.state, skills, items: { ...saved.doc.state.items, gold } };
  s.ctx.store.write(me.player.id, { ...saved.doc, state }, saved.rev, s.clock.now);
  await post(s, '/api/castle/open', { requestId: `req-open-${name}` }, cookie);
  return { cookie, id: me.player.id };
}

function raise(l: Lord, level: number, extra: Partial<E.Castle> = {}) {
  const castles = new CastleStore(s.ctx);
  const c = castles.read(l.id)!;
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as E.Castle['levels'];
  const raised = { ...c, levels, shieldUntil: s.clock.now - 1, activeAp: 200, ...extra };
  castles.write({ ...raised, rating: E.bastionRating(raised) });
}

let req = 0;
const act = (l: Lord, action: unknown) =>
  post(s, '/api/castle/act', { requestId: `req-news-${++req}`, action }, l.cookie);
const notices = async (l: Lord) =>
  (
    JSON.parse((await s.app.inject({ method: 'GET', url: '/api/notices', headers: { cookie: l.cookie } })).body) as {
      notices: GameEvent[];
    }
  ).notices;

describe('Castle Clash news', () => {
  it('tells a besieged lord who came and what they took, and the attacker how it ended', async () => {
    s = await server();
    const att = await lord('Stormer', 20, 50_000_000);
    const def = await lord('Warden', 20, 0);
    raise(att, 40);
    raise(def, 20, { treasury: 30_000_000 });
    await act(att, { type: 'siege', target: def.id });
    const heard = (await notices(def)).find((e) => e.type === 'castleBesieged');
    expect(heard).toMatchObject({ type: 'castleBesieged', foe: 'Stormer' });
    const log = new CastleStore(s.ctx).logs(def.id)[0];
    expect(heard).toMatchObject({ outcome: log.data.outcome, marks: log.data.marks });
    if (log.data.outcome !== 'repelled') expect(heard).toMatchObject({ lost: log.data.raided });
    expect((await notices(att)).find((e) => e.type === 'castleSiege')).toMatchObject({ foe: 'Warden' });
    // No player's name is kept in telemetry.
    const kept = s.ctx.store.sqlite.prepare("select data from telemetry where type like 'game.castle%'").all() as {
      data: string;
    }[];
    expect(kept.length).toBeGreaterThanOrEqual(2);
    for (const k of kept) expect(k.data).not.toMatch(/Stormer|Warden/);
  });

  it('tells a lord whose castle caught a spy, by the spy master’s name', async () => {
    s = await server();
    const att = await lord('Prowler', 20, 50_000_000);
    const def = await lord('Watcher', 20, 0);
    raise(att, 6);
    raise(def, 6);
    const rolls = vi.spyOn(Math, 'random').mockReturnValue(0.95);
    await act(att, { type: 'spy', target: def.id, mission: 'scout' }).finally(() => rolls.mockRestore());
    expect((await notices(def)).find((e) => e.type === 'castleSpyCaught')).toMatchObject({ foe: 'Prowler' });
    expect((await notices(att)).some((e) => e.type === 'castleSpyCaught')).toBe(false);
  });

  it('takes the name of a deleted lord out of the notices of those they struck', async () => {
    s = await server();
    const att = await lord('Vanisher', 20, 50_000_000);
    const def = await lord('Remainer', 20, 0);
    raise(att, 40);
    raise(def, 20, { treasury: 30_000_000 });
    await act(att, { type: 'siege', target: def.id });
    erase(s.ctx, att.id);
    const kept = (await notices(def)).find((e) => e.type === 'castleBesieged');
    expect(kept).toMatchObject({ type: 'castleBesieged', foe: '' });
    expect(JSON.stringify(await notices(def))).not.toContain('Vanisher');
  });
});
