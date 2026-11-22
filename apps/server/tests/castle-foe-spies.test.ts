// Spies at the day's foes over HTTP (session 167): a new lord sends agents against one of the day's
// strongholds or the fortress at their tier from the first day, paying a young castle's bribe, which is
// burned; the work is kept on their own castle and named in their report; a fallen stronghold, another
// tier's fortress and scouting a foe are refused before anything is spent.
import { XP_TABLE } from '@idle-clash/content';
import { allSkills, castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { CastleStore } from '../src/castle/store.ts';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;

async function newLord(name: string, gold: number) {
  const cookie = await signUp(s, name);
  const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
    player: { id: string };
  };
  const id = me.player.id;
  const saved = s.ctx.store.read(id, s.clock.now)!;
  const skills = Object.fromEntries(allSkills().map((k) => [k, { xp: XP_TABLE[3] }]));
  const state = { ...saved.doc.state, skills, items: { ...saved.doc.state.items, gold } };
  s.ctx.store.write(id, { ...saved.doc, state }, saved.rev, s.clock.now);
  await post(s, '/api/castle/open', { requestId: `open-${name}` }, cookie);
  return { cookie, id };
}

let n = 0;
const result = async (cookie: string, action: unknown) =>
  (
    JSON.parse((await post(s, '/api/castle/act', { requestId: `foe-spy-${++n}`, action }, cookie)).body) as {
      result: { ok: boolean; reason?: string; success?: boolean; bribe?: number };
    }
  ).result;

describe('spies at the day’s foes over HTTP', () => {
  it('sends agents at a stronghold and the fortress from the first day, for a young castle’s bribe', async () => {
    s = await server();
    const me = await newLord('Fledgling', 50_000);
    const castles = new CastleStore(s.ctx);
    const c = castles.read(me.id)!;
    expect(E.lordsOpen(c, s.clock.now)).toBe(false);
    const merc = E.mercenaries(c, s.clock.now, 5)[0];
    const done = await result(me.cookie, { type: 'spy', target: merc.id, mission: 'poison' });
    expect(done.ok).toBe(true);
    expect(done.bribe).toBe(Math.round(0.5 * 100 * 540 * 1.5 * (540 / 2400)));
    const gold = s.ctx.store.read(me.id, s.clock.now)!.doc.state.items.gold;
    expect(gold).toBe(50_000 - done.bribe!);
    const after = castles.read(me.id)!;
    expect(E.foeOps(after, merc.id, s.clock.now).poison).toBe(done.success ? 1 : 0);
    const fort = await result(me.cookie, { type: 'spy', target: E.fortressKey(1), mission: 'sabotage' });
    expect(fort.ok).toBe(true);
    const logs = castles.logs(me.id).filter((l) => l.kind === 'spyOut');
    expect(logs.map((l) => l.data.foe).sort()).toEqual([E.fortressKey(1), merc.id].sort());
  });

  it('refuses another tier’s fortress, scouting a foe and a fallen stronghold, spending nothing', async () => {
    s = await server();
    const me = await newLord('Wary', 50_000);
    expect((await result(me.cookie, { type: 'spy', target: E.fortressKey(2), mission: 'poison' })).reason).toBe(
      'unknown',
    );
    const castles = new CastleStore(s.ctx);
    const c = castles.read(me.id)!;
    const merc = E.mercenaries(c, s.clock.now, 5)[0];
    expect((await result(me.cookie, { type: 'spy', target: merc.id, mission: 'scout' })).reason).toBe('unknown');
    castles.write(
      E.withPair(c, { ...E.pairOf(c, merc.id, s.clock.now), sieges: [s.clock.now], fell: true }, s.clock.now),
    );
    expect((await result(me.cookie, { type: 'spy', target: merc.id, mission: 'poison' })).reason).toBe('unknown');
    expect(s.ctx.store.read(me.id, s.clock.now)!.doc.state.items.gold).toBe(50_000);
  });
});
