// Castle Clash under a storm of play (session 32's sweep): three lords take hundreds of random actions
// over simulated weeks (every action the routes accept, against each other and today's strongholds).
// After each one, no gold has been made or lost unaccounted (purses, treasuries, the war chest and the
// gold destroyed always sum to the start), no server error, and every castle stays sound.
import { XP_TABLE } from '@idle-clash/content';
import { allSkills, castleEngine as E } from '@idle-clash/features';
import { describe, expect, it } from 'vitest';
import { CastleStore } from '../src/castle/store.ts';
import { post, server, signUp, type TestServer } from './helpers.ts';

let s: TestServer;
const H = 3_600_000;

// mulberry32: the same storm every run.
function generator(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4_294_967_296;
  };
}

describe('Castle Clash under random play', () => {
  it('never makes or loses gold unaccounted, never errs, and keeps every castle sound', async () => {
    s = await server();
    const rand = generator(32);
    const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
    const castles = new CastleStore(s.ctx);
    const lords: { cookie: string; id: string }[] = [];
    for (const [i, name] of ['Ashford', 'Briarwood', 'Coldharbour'].entries()) {
      const cookie = await signUp(s, name);
      const id = (
        JSON.parse((await s.app.inject({ method: 'GET', url: '/api/me', headers: { cookie } })).body) as {
          player: { id: string };
        }
      ).player.id;
      const saved = s.ctx.store.read(id, s.clock.now)!;
      const skills = Object.fromEntries(allSkills().map((k) => [k, { xp: XP_TABLE[30 + i * 5] }]));
      const state = { ...saved.doc.state, skills, items: { ...saved.doc.state.items, gold: 400_000_000 } };
      s.ctx.store.write(id, { ...saved.doc, state }, saved.rev, s.clock.now);
      await post(s, '/api/castle/open', { requestId: `req-fuzz-open-${i}` }, cookie);
      const c = castles.read(id)!;
      const level = 8 + i * 3;
      const levels = Object.fromEntries(Object.keys(c.levels).map((k) => [k, level])) as E.Castle['levels'];
      const raised = { ...c, levels, shieldUntil: s.clock.now - 1, activeAp: 240, treasury: 20_000_000, warMarks: 300 };
      castles.write({ ...raised, rating: E.bastionRating(raised) });
      lords.push({ cookie, id });
    }

    const purse = (id: string) => s.ctx.store.read(id, s.clock.now)!.doc.state.items.gold ?? 0;
    const ledger = () =>
      s.ctx.store.sqlite
        .prepare('select war_chest_reserve_gold c, gold_destroyed d from bastion_global_state')
        .get() as {
        c: number;
        d: number;
      };
    const total = () => {
      const l = ledger();
      return lords.reduce((n, x) => n + purse(x.id) + castles.read(x.id)!.treasury, 0) + l.c + l.d;
    };
    const start = total();
    const ratings = new Map(lords.map((l) => [l.id, castles.read(l.id)!.rating]));
    const ids = ['walls', 'deepVault', 'watchtower', 'spyGuild', 'vanguard', 'outriders', 'siege'];
    const shares = (): [number, number, number] => {
      const a = Math.floor(rand() * 21) * 5;
      const b = Math.floor(rand() * ((100 - a) / 5 + 1)) * 5;
      return [a, b, 100 - a - b];
    };

    let n = 0;
    for (let step = 0; step < 1200; step++) {
      s.clock.now += Math.floor(rand() * 3 * H);
      const me = pick(lords);
      const other = pick(lords.filter((l) => l !== me)).id;
      const day = new Date(s.clock.now).toISOString().slice(0, 10);
      const target = rand() < 0.3 ? `merc:${day}:${Math.floor(rand() * 5)}` : other;
      const action = pick([
        { type: 'callToArms' },
        { type: 'deposit', gold: 1 + Math.floor(rand() * 30_000_000) },
        { type: 'withdraw', gold: 1 + Math.floor(rand() * 10_000_000) },
        { type: 'edict', edict: pick(['harvest', 'vigor', 'fortune', null]) },
        { type: 'payFrom', treasury: rand() < 0.5 },
        { type: 'upgrade', id: pick(ids) },
        { type: 'research', tech: pick(['logistics', 'siegecraft', 'fortification', 'espionage']) },
        { type: 'forgeRelic', relic: pick(['aegis-shard', 'banner-of-the-first-king', 'tidings-stone']) },
        { type: 'equipRelics', relics: rand() < 0.5 ? ['aegis-shard'] : [] },
        { type: 'offense', shares: shares() },
        { type: 'defense', defense: shares(), trap: pick(['boiling-pitch', 'counter-battery', null]) },
        { type: 'mend', what: pick(['walls', 'wounds']) },
        { type: 'drill', unit: pick(['vanguard', 'outriders', 'siege']), times: 1 + Math.floor(rand() * 3) },
        { type: 'excavate' },
        { type: 'scoutIncursion' },
        { type: 'incursion' },
        { type: 'spy', target: other, mission: pick(['scout', 'poison', 'sabotage', 'forge']) },
        { type: 'siege', target },
        { type: 'siege', target },
      ] as const);
      const res = await post(s, '/api/castle/act', { requestId: `req-fuzz-${++n}`, action }, me.cookie);
      expect(res.statusCode, `${JSON.stringify(action)}: ${res.body}`).toBe(200);
      expect(total(), `gold after ${JSON.stringify(action)}`).toBe(start);
      for (const l of lords) {
        const c = castles.read(l.id)!;
        expect(Number.isFinite(c.activeAp) && c.activeAp >= 0).toBe(true);
        expect(Number.isInteger(c.treasury) && c.treasury >= 0).toBe(true);
        expect(Object.values(c.levels).every((v) => v >= 1 && v <= 100)).toBe(true);
        expect(c.offense.reduce((a, b) => a + b, 0)).toBe(100);
        expect(c.defense.reduce((a, b) => a + b, 0)).toBe(100);
        expect(c.wallIntegrity).toBeGreaterThanOrEqual(50);
        expect(c.wallIntegrity).toBeLessThanOrEqual(100);
        expect(c.infirmaryPct).toBeGreaterThanOrEqual(0);
        expect(c.infirmaryPct).toBeLessThanOrEqual(30);
        expect(c.warMarks).toBeGreaterThanOrEqual(0);
        expect(c.rating).toBeGreaterThanOrEqual(ratings.get(l.id)!);
        ratings.set(l.id, c.rating);
      }
    }
  }, 120_000);
});
