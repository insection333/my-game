// Seasons (session 164; the brief's long arc, item 4): every eight weeks a season opens with a twist that
// changes how it plays, lifting one part of the game for its eight weeks: Gathering, Artisan or the fighting
// skills' XP, Rare and Legendary finds, expedition marks, or what gathering brings. The twists come round in
// turn, so the best choice changes as the seasons do; nothing before the first season is lifted.
import { createEngine, HOUR, newState, seeded, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { actionRegistry, FEATURES } from '../src/index.ts';
import {
  SEASON_DAYS,
  SEASON_EPOCH,
  seasonAt,
  seasonFindPct,
  seasonMarksPct,
  seasonXpPct,
  seasonYieldPct,
  TWISTS,
} from '../src/shared/season.ts';

const DAY = 86_400_000;

describe('the seasons', () => {
  it('open every eight weeks from the first, each with the next twist', () => {
    expect(seasonAt(SEASON_EPOCH - 1)).toBeNull();
    const first = seasonAt(SEASON_EPOCH)!;
    expect(first).toMatchObject({ number: 1, start: SEASON_EPOCH, end: SEASON_EPOCH + SEASON_DAYS * DAY });
    const second = seasonAt(SEASON_EPOCH + SEASON_DAYS * DAY)!;
    expect(second.number).toBe(2);
    expect(second.twist.id).not.toBe(first.twist.id);
    const ids = Array.from(
      { length: TWISTS.length },
      (_, i) => seasonAt(SEASON_EPOCH + i * SEASON_DAYS * DAY)!.twist.id,
    );
    expect(new Set(ids).size).toBe(TWISTS.length);
  });

  it('lifts only what its twist names, and nothing before the first season', () => {
    const at = (id: string) => {
      const i = TWISTS.findIndex((t) => t.id === id);
      return SEASON_EPOCH + i * SEASON_DAYS * DAY + DAY;
    };
    expect(seasonXpPct('woodcutting', at('greenwood'))).toBe(20);
    expect(seasonXpPct('smithing', at('greenwood'))).toBe(0);
    expect(seasonXpPct('smithing', at('forgefire'))).toBe(20);
    expect(seasonXpPct('hitpoints', at('muster'))).toBe(20);
    expect(seasonFindPct(at('omens'))).toBe(30);
    expect(seasonFindPct(at('greenwood'))).toBe(0);
    expect(seasonMarksPct(at('road'))).toBe(25);
    expect(seasonYieldPct('fishing', at('plenty'))).toBe(10);
    expect(seasonYieldPct('cooking', at('plenty'))).toBe(0);
    expect(seasonXpPct('woodcutting', SEASON_EPOCH - DAY)).toBe(0);
  });
});

const engine = createEngine(actionRegistry(FEATURES, () => true));

/** A day chopping pine from `t0`, hour by hour. */
function day(t0: number): State {
  const pine = { feature: 'woodcutting', id: 'pine-tree' };
  let s = engine.command(newState(4, t0), t0, { type: 'start', lane: 'gathering', action: pine }, seeded(1)).state;
  for (let at = t0 + HOUR; at <= t0 + 24 * HOUR; at += HOUR)
    s = engine.advance({ ...s, lastSeen: at }, at, seeded(1)).state;
  return s;
}

describe('a season in play', () => {
  it('pays its XP where the engine pays (a day of pine in the Greenwood)', () => {
    const before = day(SEASON_EPOCH - 3 * DAY).skills.woodcutting.xp;
    const greenwood = day(SEASON_EPOCH + DAY).skills.woodcutting.xp;
    expect(greenwood / before).toBeGreaterThan(1.19);
    expect(greenwood / before).toBeLessThan(1.2);
  });

  it('brings more of what gathering brings in a season of plenty', () => {
    const i = TWISTS.findIndex((t) => t.id === 'plenty');
    const plenty = day(SEASON_EPOCH + i * SEASON_DAYS * DAY + DAY).items['pine-logs'] ?? 0;
    const before = day(SEASON_EPOCH - 3 * DAY).items['pine-logs'] ?? 0;
    expect(plenty / before).toBeGreaterThan(1.05);
  });
});
