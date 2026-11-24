// The legendary siege over HTTP (session 220): in a season, a lord at fortress tier 10 or more assaults its
// next chamber and sends spies at it; the battle is told as an event and kept in the reports; outside a season,
// below tier 10, or with all five taken, it is refused.
import { XP_TABLE } from '@idle-clash/content';
import { allSkills, castleEngine as E } from '@idle-clash/features';
import { afterEach, describe, expect, it } from 'vitest';
import { CastleStore } from '../src/castle/store.ts';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
afterEach(() => s?.close());
const IN2 = Date.UTC(2027, 0, 5, 12);

async function lord(name: string, tier: number) {
  const cookie = await signUp(s, name);
  const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
    player: { id: string };
  };
  const saved = s.ctx.store.read(me.player.id, s.clock.now)!;
  const skills = Object.fromEntries(allSkills().map((k) => [k, { xp: XP_TABLE[60] }]));
  const state = { ...saved.doc.state, skills, items: { ...saved.doc.state.items, gold: 50_000_000 } };
  s.ctx.store.write(me.player.id, { ...saved.doc, state }, saved.rev, s.clock.now);
  await post(s, '/api/castle/open', { requestId: `open-${name}` }, cookie);
  const castles = new CastleStore(s.ctx);
  const c = castles.read(me.player.id)!;
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, 40])) as E.Castle['levels'];
  castles.write({ ...c, levels, incursionTier: tier, activeAp: 500 });
  return { cookie, id: me.player.id, castles };
}

let n = 0;
const act = async (cookie: string, action: unknown) =>
  JSON.parse((await post(s, '/api/castle/act', { requestId: `legend-${++n}`, action }, cookie)).body) as {
    result: { ok: boolean; reason?: string; won?: boolean; chamber?: number };
    events?: { type: string }[];
  };

describe('the legendary siege over HTTP', () => {
  it('assaults the next chamber and takes spies at it, told and kept in the reports', async () => {
    s = await server();
    s.clock.now = IN2;
    const me = await lord('Warden', 12);
    const spies = await act(me.cookie, { type: 'spy', target: E.chamberKey(2, 0), mission: 'poison' });
    expect(spies.result.ok).toBe(true);
    const r = await act(me.cookie, { type: 'legend' });
    expect(r.result).toMatchObject({ ok: true, chamber: 0 });
    const c = me.castles.read(me.id)!;
    expect(c.legendSeason).toBe(2);
    expect(me.castles.logs(me.id).some((l) => l.kind === 'legend')).toBe(true);
    // Another season's chamber, or the next chamber before its turn, is not a foe for the spies.
    const wrong = await act(me.cookie, { type: 'spy', target: E.chamberKey(2, 3), mission: 'poison' });
    expect(wrong.result.reason).toBe('unknown');
  });

  it('opens a chamber a week: before its week neither the assault nor the spies go (session 223)', async () => {
    s = await server();
    s.clock.now = IN2;
    const me = await lord('Steward', 12);
    // Eight days into season 2: the first two chambers stand open.
    for (const chamber of [0, 1]) expect((await act(me.cookie, { type: 'legend' })).result).toMatchObject({ chamber });
    expect((await act(me.cookie, { type: 'legend' })).result.reason).toBe('locked');
    const early = await act(me.cookie, { type: 'spy', target: E.chamberKey(2, 2), mission: 'poison' });
    expect(early.result.reason).toBe('unknown');
    s.clock.now = E.chamberOpens(2, 2) + 60_000;
    const open = await act(me.cookie, { type: 'spy', target: E.chamberKey(2, 2), mission: 'poison' });
    expect(open.result.ok).toBe(true);
  });

  it('is refused before tier 10 and outside a season', async () => {
    s = await server();
    s.clock.now = IN2;
    const young = await lord('Squire', 5);
    expect((await act(young.cookie, { type: 'legend' })).result.reason).toBe('unknown');
    s.clock.now = Date.UTC(2026, 9, 25);
    const early = await lord('Early', 12);
    expect((await act(early.cookie, { type: 'legend' })).result.reason).toBe('locked');
  });
});
