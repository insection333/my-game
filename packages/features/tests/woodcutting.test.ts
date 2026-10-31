import { formatStop, XP_TABLE } from '@idle-clash/content';
import { createEngine, newState, SECOND, seeded, type Command, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';
import { woodcutting } from '../src/woodcutting/index.ts';

const T0 = Date.UTC(2026, 9, 20, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const rng = seeded(11);
const pine = { feature: 'woodcutting', id: 'pine-tree' };
const atLevel = (level: number): State => ({ ...newState(11, T0), skills: { woodcutting: { xp: XP_TABLE[level] } } });
const cmd = (s: State, c: Command, at = T0) => engine.command(s, at, c, rng);

describe('woodcutting', () => {
  it('chops pine for logs and XP, more XP while the fire burns', () => {
    const s = cmd(newState(11, T0), { type: 'start', lane: 'gathering', action: pine }).state;
    const fire = engine.advance(s, T0 + 75 * SECOND, rng).state;
    expect(fire.items['pine-logs']).toBe(10);
    // 11 XP and 8% more (the fire's first heat): 11.88 a chop, carried exactly in thousandths.
    expect(fire.skills.woodcutting).toEqual({ xp: 118, part: 800 });
  });

  it('earns more as the fire burns hotter, kept from going out', () => {
    // Stoked every four minutes for 25 minutes: the fire's heat climbs from 8% to 14% to 17%.
    let s = cmd(newState(11, T0), { type: 'start', lane: 'gathering', action: pine }).state;
    for (let m = 4; m <= 24; m += 4) s = cmd(s, { type: 'stoke' }, T0 + m * 60_000).state;
    const before = engine.advance(s, T0 + 24 * 60_000, rng).state;
    const after = engine.advance(before, T0 + 24 * 60_000 + 75 * SECOND, rng).state;
    const per =
      (after.skills.woodcutting.xp - before.skills.woodcutting.xp) /
      (after.mastery['woodcutting:pine-tree'] - before.mastery['woodcutting:pine-tree']);
    expect(per).toBeGreaterThan(11 * 1.16);
  });

  it('refuses a tree above your level, and says why in words', () => {
    const out = cmd(newState(11, T0), {
      type: 'start',
      lane: 'gathering',
      action: { feature: 'woodcutting', id: 'old-pine' },
    });
    expect(out.result).toEqual({ ok: false, reason: { code: 'levelTooLow', detail: { level: 5 } } });
    if (!out.result.ok) expect(formatStop(out.result.reason)).toBe('Needs level 5');
  });

  it('chops faster with Quick swing at level 2', () => {
    const s = cmd(atLevel(2), { type: 'start', lane: 'gathering', action: pine }).state;
    const run = s.lanes.gathering.current!;
    expect(run.endsAt - run.startedAt).toBe(Math.round(7500 / 1.025));
  });

  it('is not playable while its flag is off', () => {
    const live = createEngine(actionRegistry(FEATURES, (f) => f.id !== 'woodcutting'));
    const out = live.command(newState(11, T0), T0, { type: 'start', lane: 'gathering', action: pine }, rng);
    expect(out.result).toMatchObject({ ok: false, reason: { code: 'unavailable' } });
  });

  it('fills its slots with formatted text', () => {
    const ctx = { state: atLevel(14), now: T0 };
    expect(woodcutting.slots['skill.header'](ctx)).toMatchObject({
      name: 'Woodcutting',
      level: 'Level 14',
      toNext: '12,800 XP to level 15',
      nextUnlock: "Level 15: Woodsman's eye (Rare and Legendary finds 24% likelier in all)",
      tier: 2,
      top: false,
    });
    // The seal's rim follows the highest tier reached; a star at the top level.
    expect(woodcutting.slots['skill.header']({ state: atLevel(20), now: T0 })).toMatchObject({ tier: 3, top: false });
    expect(woodcutting.slots['skill.header']({ state: atLevel(40), now: T0 })).toMatchObject({ tier: 5, top: false });
    expect(woodcutting.slots['skill.header']({ state: atLevel(99), now: T0 })).toMatchObject({ tier: 8, top: true });
    const rows = woodcutting.slots['skill.actions'](ctx) as { name: string; locked: boolean; xpPerHour: string }[];
    expect(rows.map((r) => [r.name, r.locked])).toContainEqual(['Old ash', false]);
    expect(rows.find((r) => r.name === 'Oak tree')).toMatchObject({ locked: true });
    const ladder = woodcutting.slots['skill.ladder'](ctx) as { unlocks: string[] }[];
    expect(ladder[39].unlocks).toEqual(['Maple tree', 'Master woodcutter (+10% chance of an extra item)']);
    expect(ladder[98].unlocks).toEqual(['Grandmaster woodcutter (+15% chance of an extra item)']);
  });
});
