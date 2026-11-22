// The lords on offer in a small realm (session 137): the list reaches a step further while fewer than three
// stand near your rating, counting the shielded among them (so a busy bracket does not spill onto the far
// weaker), offers only the unshielded, and never a castle not yet open to lords.
import { XP_TABLE } from '@idle-clash/content';
import { allSkills, castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { CastleStore } from '../src/castle/store.ts';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
let req = 0;

interface Lord {
  cookie: string;
  id: string;
}

/** A lord of total level 11 × 20, with a castle. */
async function lord(name: string): Promise<Lord> {
  const cookie = await signUp(s, name);
  const me = JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
    player: { id: string };
  };
  const id = me.player.id;
  const saved = s.ctx.store.read(id, s.clock.now)!;
  const skills = Object.fromEntries(allSkills().map((k) => [k, { xp: XP_TABLE[20] }]));
  s.ctx.store.write(id, { ...saved.doc, state: { ...saved.doc.state, skills } }, saved.rev, s.clock.now);
  await post(s, '/api/castle/open', { requestId: `req-open-${++req}` }, cookie);
  return { cookie, id };
}

/** Sets a castle's levels directly (as months of play would), past its novice shield unless told. */
function raise(l: Lord, level: number, extra: Partial<E.Castle> = {}) {
  const castles = new CastleStore(s.ctx);
  const c = castles.read(l.id)!;
  const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as E.Castle['levels'];
  const raised = { ...c, levels, shieldUntil: s.clock.now - 1, ...extra };
  castles.write({ ...raised, rating: E.bastionRating(raised) });
}

const targets = async (l: Lord) =>
  JSON.parse(
    (await s.app.inject({ method: 'GET', url: '/api/castle/targets', headers: { cookie: l.cookie } })).body,
  ) as E.CastleTargets;

describe('the lords on offer', () => {
  it('reaches further when few stand near, and offers none not yet open to lords', async () => {
    s = await server();
    const [me, near, far, further, young] = await Promise.all(
      ['Middling', 'Neighbour', 'Distant', 'Farflung', 'Fledgling'].map((n) => lord(n)),
    );
    raise(me, 4);
    raise(near, 4);
    raise(far, 6);
    raise(further, 7);
    // Raised today, averaging under level 2 (session 167), its shield down: in reach, but not yet open to lords.
    const levels = { walls: 3, deepVault: 1, watchtower: 1, spyGuild: 1, vanguard: 3, outriders: 3, siege: 1 };
    raise(young, 3, { createdAt: s.clock.now, levels });
    const t = await targets(me);
    expect(t.reach).toBe(2);
    expect(t.lords.map((l) => l.name).sort()).toEqual(['Distant', 'Farflung', 'Neighbour']);
  });

  it('counts shielded neighbours toward the near bracket, offering only the unshielded', async () => {
    s = await server();
    const [me, a, b, c, far] = await Promise.all(
      ['Keeper', 'Shield', 'Buckler', 'Open', 'Weakling'].map((n) => lord(n)),
    );
    raise(me, 6);
    raise(a, 6, { shieldUntil: s.clock.now + 3_600_000 });
    raise(b, 6, { shieldUntil: s.clock.now + 3_600_000 });
    raise(c, 6);
    raise(far, 4);
    const t = await targets(me);
    expect(t.reach).toBe(0);
    expect(t.lords.map((l) => l.name)).toEqual(['Open']);
  });
});
