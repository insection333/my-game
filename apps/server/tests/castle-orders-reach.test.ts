// A day's orders know whether a lord stands in reach (session 169). Lords open three days after a castle is
// raised (session 167), and a lord alone in a small realm was ordered to "Besiege a lord" with none to
// besiege, an order it could not keep, and so never the three together.
import { XP_TABLE } from '@idle-clash/content';
import { allSkills, castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { CastleStore } from '../src/castle/store.ts';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
const DAY = 86_400_000;

async function lord(name: string) {
  const cookie = await signUp(s, name);
  const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
    player: { id: string };
  };
  const saved = s.ctx.store.read(me.player.id, s.clock.now)!;
  const skills = Object.fromEntries(allSkills().map((k) => [k, { xp: XP_TABLE[5] }]));
  s.ctx.store.write(me.player.id, { ...saved.doc, state: { ...saved.doc.state, skills } }, saved.rev, s.clock.now);
  await post(s, '/api/castle/open', { requestId: `open-${name}` }, cookie);
  const castles = new CastleStore(s.ctx);
  // Raised four days ago, every level 3, the novice shield down: open to lords.
  const c = castles.read(me.player.id)!;
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, 3])) as E.Castle['levels'];
  const raised = { ...c, levels, createdAt: s.clock.now - 4 * DAY, shieldUntil: 0, orders: null };
  castles.write({ ...raised, rating: E.bastionRating(raised) });
  return { cookie, id: me.player.id };
}

const kindsOver = async (cookie: string, days: number) => {
  const kinds: string[] = [];
  for (let d = 0; d < days; d++) {
    const view = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/castle', headers: { cookie } })).body) as {
      castle: E.Castle;
    };
    kinds.push(...E.ordersOf(view.castle, s.clock.now).list.map((o) => o.kind));
    s.clock.now += DAY;
  }
  return kinds;
};

describe("a day's orders and the lords in reach", () => {
  it('never orders a siege on a lord when none stands in reach', async () => {
    s = await server();
    const alone = await lord('Alone');
    expect(await kindsOver(alone.cookie, 12)).not.toContain('lord');
  });

  it('orders one some days when a lord stands near', async () => {
    s = await server();
    const me = await lord('Neighbourly');
    await lord('Neighbour');
    expect(await kindsOver(me.cookie, 12)).toContain('lord');
  });
});
