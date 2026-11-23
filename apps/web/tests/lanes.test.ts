// The lanes as the shell shows them: each says what it is doing, with that action's icon (a fight its
// foe, not the foe's drop), and a stopped lane says why and what puts it right.
// The game installs its late icons (every icon but the welcome page's) before any of its pages draws.
import '../src/late-icons.ts';
import { actionRegistry, FEATURES } from '@idle-clash/features';
import { XP_TABLE } from '@idle-clash/content';
import { createEngine, newState, seeded, type Command, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { iconOf, laneViews } from '../src/shell/Lanes.tsx';

const T0 = Date.UTC(2026, 9, 27, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const run = (s: State, c: Command) => engine.command(s, T0, c, seeded(1)).state;

describe('laneViews', () => {
  it('shows a fight by its foe and a gathering action by what it gives', () => {
    let s: State = {
      ...newState(1, T0),
      items: { 'copper-sword': 1 },
      features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
    };
    s = run(s, { type: 'start', lane: 'combat', action: { feature: 'combat', id: 'hollow-rat' } });
    s = run(s, { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } });
    const views = laneViews(s, T0 + 1000, FEATURES);
    expect(views.find((v) => v.id === 'combat')).toMatchObject({ doing: 'Hollow rat', icon: 'hollow-rat' });
    expect(views.find((v) => v.id === 'gathering')).toMatchObject({ doing: 'Pine tree', icon: 'pine-logs' });
  });

  // Session 46: a boss fought in the lane showed its drop (an ingot), not itself.
  it('shows a boss fought in the lane by the boss, and an expedition by what it is', () => {
    expect(iconOf(FEATURES, { feature: 'expeditions', id: 'troll-chief' }, 'combat')).toBe('troll-chief');
    expect(iconOf(FEATURES, { feature: 'combat', id: 'hollow-rat' }, 'combat')).toBe('hollow-rat');
    expect(iconOf(FEATURES, { feature: 'woodcutting', id: 'pine-tree' }, 'gathering')).toBe('pine-logs');
  });

  // Session 89: a lane stopped for want of something, once put right, offers to start that action again
  // (bought food, ore mined), where it went on offering the fix ("Buy food") until the player found the row.
  it('offers to start a stopped action again once the engine would take it', () => {
    let s: State = { ...newState(1, T0), items: { 'copper-ore': 1 } };
    s = run(s, { type: 'start', lane: 'artisan', action: { feature: 'smithing', id: 'copper-bar' } });
    s = engine.advance(s, T0 + 60_000, seeded(1)).state;
    const canStart = (st: State) => (lane: 'artisan', action: { feature: string; id: string }) =>
      engine.command(st, T0 + 60_000, { type: 'start', lane, action }, seeded(1)).result.ok;
    const artisan = (st: State) =>
      laneViews(st, T0 + 60_000, FEATURES, canStart(st) as never).find((v) => v.id === 'artisan')!;
    expect(artisan(s)).toMatchObject({ halted: true, again: undefined });
    expect(artisan(s).fix?.item).toBe('copper-ore');
    const mined = { ...s, items: { ...s.items, 'copper-ore': 4 } };
    expect(artisan(mined)).toMatchObject({
      halted: true,
      again: { label: 'Start again', action: { feature: 'smithing', id: 'copper-bar' } },
      fix: undefined,
    });
  });

  // Session 108: a boss fought in the lane is an expeditions action too, and its chip asked for a region's
  // short name ("combat.region.troll-chief.short"), so Fight on a boss blanked the page.
  it('names a boss fought in the lane on its chip, as only a run is named by its region', () => {
    let s: State = {
      ...newState(1, T0),
      skills: { hitpoints: { xp: XP_TABLE[60] }, melee: { xp: XP_TABLE[40] } },
      items: { 'copper-sword': 1, bread: 50 },
      features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
    };
    s = run(s, { type: 'start', lane: 'combat', action: { feature: 'expeditions', id: 'troll-chief' } });
    expect(s.lanes.combat.current?.action.id).toBe('troll-chief');
    expect(laneViews(s, T0 + 1000, FEATURES).find((v) => v.id === 'combat')).toMatchObject({
      chip: 'The Troll-chief of the hill',
    });
  });

  // Session 122: a stopped lane said why ("Out of copper ore") but not what it had been doing, so a run
  // stopped by a full Storehouse read only "Storehouse full" under Combat, with no word of the run waiting.
  it('names what a stopped lane was doing, with its picture, and says why below it', () => {
    let s: State = { ...newState(1, T0), items: { 'copper-ore': 1 } };
    s = run(s, { type: 'start', lane: 'artisan', action: { feature: 'smithing', id: 'copper-bar' } });
    s = engine.advance(s, T0 + 60_000, seeded(1)).state;
    expect(laneViews(s, T0 + 60_000, FEATURES).find((v) => v.id === 'artisan')).toMatchObject({
      halted: true,
      doing: 'Copper bar',
      icon: 'copper-bar',
      note: 'Out of copper ore',
    });
  });
});

// Session 147: a newcomer's Artisan lane, forging the first steps' sword, ran out of copper bars two
// minutes in, and offered only "Where to get copper bar" (its panel, then Smithing, then the row) while
// they held the ore to smelt more. It now offers to make the bar in the lane, when the engine would.
describe('a lane out of what it can make itself', () => {
  const smithing = FEATURES.find((f) => f.id === 'smithing')!;
  const sword = smithing.content.actions!.find((a) => a.gives?.[0]?.item === 'copper-sword')!;
  const at = T0 + 3_600_000;
  const view = (st: State) =>
    laneViews(
      st,
      at,
      FEATURES,
      ((lane: 'artisan', action: { feature: string; id: string }) =>
        engine.command(st, at, { type: 'start', lane, action }, seeded(1)).result.ok) as never,
    ).find((v) => v.id === 'artisan')!;
  const forged = (ore: number) => {
    let s: State = {
      ...newState(1, T0),
      skills: { smithing: { xp: XP_TABLE[5] } },
      items: { 'copper-bar': 4 },
    };
    s = run(s, { type: 'start', lane: 'artisan', action: { feature: 'smithing', id: sword.id } });
    s = engine.advance(s, at, seeded(1)).state;
    return { ...s, items: { ...s.items, 'copper-ore': ore } };
  };

  it('offers to make it when the engine would, in place of where to get it', () => {
    expect(view(forged(3))).toMatchObject({
      halted: true,
      make: { label: 'Make copper bar', action: { feature: 'smithing', id: 'copper-bar' } },
      fix: undefined,
    });
  });

  it('points to where to get it while it cannot be made', () => {
    const v = view(forged(0));
    expect(v.make).toBeUndefined();
    expect(v.fix?.item).toBe('copper-bar');
  });

  // Session 149: a lane out of an ingredient another lane is making now starts again by itself as it comes
  // in, so it says it waits, where "Out of copper ore" read as stopped for good.
  it('says a lane out of an ingredient waits for it while another lane makes it', () => {
    let s: State = { ...newState(1, T0), items: { 'copper-ore': 1 } };
    s = run(s, { type: 'start', lane: 'artisan', action: { feature: 'smithing', id: 'copper-bar' } });
    s = engine.advance(s, T0 + 60_000, seeded(1)).state;
    s = run(s, { type: 'start', lane: 'gathering', action: { feature: 'mining', id: 'copper-vein' } });
    const at = s.lanes.gathering.current!.startedAt + 1;
    expect(laneViews(s, at, FEATURES).find((v) => v.id === 'artisan')).toMatchObject({
      halted: true,
      note: 'Out of copper ore, waiting for more',
    });
  });

  // Session 152: a newcomer six days in chopped pine at Woodcutting 27, where oak paid 41% more XP an hour,
  // and smelted copper at Smithing 25: the goals follow the lane, and nothing said a better tree had opened.
  it('says when an open action the lane could start pays well more, and offers it', () => {
    let s: State = { ...newState(1, T0), skills: { woodcutting: { xp: XP_TABLE[27] } } };
    s = run(s, { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } });
    const can = ((lane: 'gathering', action: { feature: string; id: string }) =>
      engine.command(s, T0 + 1000, { type: 'start', lane, action }, seeded(1)).result.ok) as never;
    expect(laneViews(s, T0 + 1000, FEATURES, can).find((v) => v.id === 'gathering')).toMatchObject({
      better: {
        label: 'Start Oak tree',
        note: 'Oak tree pays 77% more XP an hour',
        action: { feature: 'woodcutting', id: 'oak-tree' },
      },
    });
    // At level 1 nothing better is open.
    let fresh: State = newState(1, T0);
    fresh = run(fresh, { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'pine-tree' } });
    expect(laneViews(fresh, T0 + 1000, FEATURES, can).find((v) => v.id === 'gathering')?.better).toBeUndefined();
  });
});
