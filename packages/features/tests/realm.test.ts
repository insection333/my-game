// The realm's boss of the week (session 174): fought once a day from the Combat lane at the player's own
// measure (the strongest foe they fare well against, with a boss's health), a win paying a fight's gold and
// marks and said as a strike; a second fight the same day refused; once the server says it fell with their
// strike, their share taken once.
import { HOUR, seeded, type GameEvent, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { expeditions } from '../src/expeditions/index.ts';
import { realmWords } from '../src/index.ts';
import { expeditionsOf } from '../src/shared/expeditions/state.ts';
import { realmBossIn, realmFoe, weekOf, REALM_HP, type RealmMirror } from '../src/shared/realm.ts';
import { FOES } from '../src/shared/combat/data.ts';
import { engine, fighterAt, T0 } from './helpers/expedition.ts';

const start = { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: 'realm' } } as const;
const mirror = (over: Partial<RealmMirror> = {}): RealmMirror => ({
  week: weekOf(T0),
  needed: 24,
  strikes: 5,
  mine: 1,
  fell: false,
  owed: null,
  ...over,
});
const told = (s: State, over: Partial<RealmMirror> = {}): State => ({
  ...s,
  features: { ...s.features, realm: mirror(over) },
});

describe("the realm's boss of the week", () => {
  it('is the strongest foe the player fares well against, with a boss’s health', () => {
    const s = fighterAt('fen', 3);
    const foe = realmFoe(s, T0)!;
    const base = FOES.find((f) => foe.id.endsWith(`:${f.id}`))!;
    expect(foe.hp).toBe(base.hp * REALM_HP);
    expect(base.tier).toBeGreaterThanOrEqual(5);
    expect(foe.id.startsWith(`realm:${realmBossIn(weekOf(T0)).id}:`)).toBe(true);
  });

  it('is fought once a day, a win paid and said as a strike', () => {
    let s = engine.command(told(fighterAt('fen', 3)), T0, start, seeded(3)).state;
    const out = engine.advance({ ...s, lastSeen: T0 + HOUR }, T0 + HOUR, seeded(3));
    const fought = out.events.filter((e): e is Extract<GameEvent, { type: 'realmFought' }> => e.type === 'realmFought');
    expect(fought).toHaveLength(1);
    expect(fought[0].won).toBe(true);
    expect(fought[0].gold).toBeGreaterThan(0);
    expect(expeditionsOf(out.state).marks).toBe(fought[0].marks);
    expect(realmWords(fought[0]).title).toMatch(/^The realm's .+: struck$/);
    s = out.state;
    const again = engine.command(s, T0 + HOUR, start, seeded(3));
    expect(again.result).toMatchObject({ ok: false, reason: { code: 'realmRested' } });
    const view = expeditions.slots['combat.realm']({ state: s, now: T0 + HOUR }) as { ready: boolean; status: string };
    expect(view.ready).toBe(false);
    expect(view.status).toMatch(/^Fought today/);
  });

  it('pays the share of a fallen boss once', () => {
    const owed = { week: weekOf(T0), boss: realmBossIn(weekOf(T0)).id };
    const s = told(fighterAt('fen', 3), { fell: true, owed });
    const r = expeditions.routes.share.run(s, {}, T0);
    expect(r.result).toEqual({ ok: true });
    expect(r.state.items.gold ?? 0).toBeGreaterThan(s.items.gold ?? 0);
    expect(expeditionsOf(r.state).realm?.fallen).toBe(1);
    expect(expeditions.routes.share.run(r.state, {}, T0).result).toEqual({ ok: false, reason: 'none' });
    expect(expeditions.routes.share.run(told(fighterAt('fen', 3)), {}, T0).result).toEqual({
      ok: false,
      reason: 'none',
    });
  });
});
