// Kindling (step 17, in place of Rekindling): nothing is ever taken away; a Path is taken only at 99,
// changed freely, and pays what it says; XP past 99 counts towards Kindlings, each announced once, and
// a Path strengthens with the first five only.
import { MAX_LEVEL, XP_TABLE } from '@idle-clash/content';
import { createEngine, HOUR, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';
import { kindling } from '../src/kindling/index.ts';
import { skillActions } from '../src/shared/catalog.ts';
import { KINDLE_XP, kindlingsIn, pathBonus, PATHS, pathPct } from '../src/shared/kindling.ts';

const T0 = Date.UTC(2026, 9, 28, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const best = skillActions()
  .find((s) => s.skill === 'woodcutting')!
  .actions.at(-1)!;
const tree = { feature: 'woodcutting', id: best.id };
const log = best.gives![0].item;

const at = (xp: number, path?: string): State => ({
  ...newState(5, T0),
  skills: { woodcutting: { xp } },
  features: path ? { kindling: { paths: { woodcutting: path } } } : {},
});
const choose = (s: State, path: string | null, skill = 'woodcutting') =>
  kindling.routes.path.run(s, { skill, path }, T0) as { state: State; result: { ok: boolean } };

/** Two hours of the best tree, from a state: what it brought and what it announced. */
function chop(s: State, seed = 7) {
  const rng = seeded(seed);
  const started = engine.command(s, T0, { type: 'start', lane: 'gathering', action: tree }, rng).state;
  const out = engine.advance(started, T0 + 2 * HOUR, rng);
  return {
    state: out.state,
    xp: out.state.skills.woodcutting.xp - s.skills.woodcutting.xp,
    logs: out.state.items[log] ?? 0,
    events: out.events,
  };
}

describe('kindling', () => {
  it('counts a Kindling for each stretch of XP past 99, and none before it', () => {
    const top = XP_TABLE[MAX_LEVEL];
    expect(kindlingsIn(top - 1)).toBe(0);
    expect(kindlingsIn(top + KINDLE_XP - 1)).toBe(0);
    expect(kindlingsIn(top + KINDLE_XP)).toBe(1);
    expect(kindlingsIn(top + 7 * KINDLE_XP + 5)).toBe(7);
  });

  it('takes nothing away: choosing, changing and leaving a Path touch nothing else', () => {
    const s: State = { ...at(XP_TABLE[MAX_LEVEL] + 3 * KINDLE_XP), items: { [log]: 40, gold: 900 } };
    let t = s;
    for (const p of ['bounty', 'lore', 'fortune', null]) {
      const out = choose(t, p);
      expect(out.result.ok).toBe(true);
      t = out.state;
      expect(t.skills).toEqual(s.skills);
      expect(t.items).toEqual(s.items);
      expect(t.mastery).toEqual(s.mastery);
      expect(t.found).toEqual(s.found);
    }
    // And a Kindling itself only adds: XP keeps rising past it and the level stays 99.
    const crossing = chop(at(XP_TABLE[MAX_LEVEL] + KINDLE_XP - 1_000));
    expect(crossing.state.skills.woodcutting.xp).toBeGreaterThan(XP_TABLE[MAX_LEVEL] + KINDLE_XP);
    expect(crossing.logs).toBeGreaterThan(0);
  });

  it('opens Paths only at 99, and a Path chosen earlier pays nothing below it', () => {
    expect(choose(at(XP_TABLE[MAX_LEVEL - 1]), 'lore').result).toEqual({ ok: false, reason: 'notTop' });
    expect(choose(at(XP_TABLE[MAX_LEVEL]), 'nonsense').result.ok).toBe(false);
    expect(choose(at(XP_TABLE[MAX_LEVEL]), 'lore', 'no-such-skill').result.ok).toBe(false);
    expect(pathBonus(at(XP_TABLE[MAX_LEVEL - 1], 'lore'), 'woodcutting', 'xp')).toBe(0);
    expect(pathBonus(at(XP_TABLE[MAX_LEVEL], 'lore'), 'woodcutting', 'xp')).toBe(15);
    expect(pathBonus(at(XP_TABLE[MAX_LEVEL], 'lore'), 'woodcutting', 'items')).toBe(0);
  });

  it('pays what each Path says: Lore more XP, Bounty more logs, Fortune more finds', () => {
    const top = XP_TABLE[MAX_LEVEL];
    const none = chop(at(top));
    const lore = chop(at(top, 'lore'));
    const bounty = chop(at(top, 'bounty'));
    expect(lore.xp / none.xp).toBeCloseTo(1.15, 1);
    expect(lore.logs).toBe(none.logs);
    expect(bounty.logs / none.logs).toBeGreaterThan(1.1);
    expect(bounty.xp).toBe(none.xp);
    expect(pathBonus(at(top, 'fortune'), 'woodcutting', 'finds')).toBe(50);
  });

  it('announces each Kindling once, with its count', () => {
    const near = chop(at(XP_TABLE[MAX_LEVEL] + 2 * KINDLE_XP - 2_000));
    const kindled = near.events.filter((e) => e.type === 'kindled');
    expect(kindled).toEqual([expect.objectContaining({ type: 'kindled', skill: 'woodcutting', count: 2 })]);
    expect(chop(at(XP_TABLE[MAX_LEVEL] + 10_000)).events.some((e) => e.type === 'kindled')).toBe(false);
  });

  it('strengthens a Path with the first five Kindlings only', () => {
    for (const p of PATHS) {
      expect(pathPct(p, 5)).toBe(p.pct + 5 * p.perKindling);
      expect(pathPct(p, 9)).toBe(pathPct(p, 5));
    }
    const fifth = at(XP_TABLE[MAX_LEVEL] + 5 * KINDLE_XP, 'lore');
    expect(pathBonus(fifth, 'woodcutting', 'xp')).toBe(30);
  });
});
