// Rivals in words (session 173): the gap to the player just above or below, as the asking player would
// close it: time at their best work on a skill's ladder, total levels on Total, goals on the season's.
import type { HiscoreRow } from '@idle-clash/contracts';
import { XP_TABLE } from '@idle-clash/content';
import '@idle-clash/features';
import { newState } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { gapWords, rivalLines } from '../src/pages/rivals-words.ts';

const T0 = Date.UTC(2026, 10, 23, 9);
const row = (rank: number, name: string, level: number, xp: number): HiscoreRow => ({
  rank,
  name,
  level,
  xp,
  milestones: 0,
  title: null,
  banner: null,
  look: null,
});
const state = { ...newState(1, T0), skills: { woodcutting: { xp: XP_TABLE[20] } } };

describe('rivals in words', () => {
  it('says a skill’s gap as time at the player’s best work there', () => {
    const you = row(2, 'Birch', 20, XP_TABLE[20]);
    const above = row(1, 'Alder', 21, XP_TABLE[20] + 5_000);
    expect(gapWords('woodcutting', you, above, state)).toMatch(
      /^about \d+ (h|min)( \d+ min)? of your [A-Z][a-z]+ tree$/,
    );
    const lines = rivalLines('woodcutting', you, { above, below: null }, state);
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toMatch(/^Alder, 1st, is about .+ ahead$/);
  });

  it('says Total in levels and the season in goals', () => {
    expect(gapWords('total', row(2, 'B', 120, 1), row(1, 'A', 123, 9), state)).toBe('3 total levels');
    expect(gapWords('total', row(2, 'B', 120, 1_000), row(1, 'A', 120, 13_000), state)).toBe('12,000 XP');
    expect(gapWords('season', row(2, 'B', 0, 4), row(1, 'A', 0, 5), state)).toBe('1 goal');
  });

  it('shows nothing to a player not yet listed or alone', () => {
    expect(rivalLines('total', row(1, 'A', 1, 1), undefined, state)).toEqual([]);
    expect(rivalLines('total', null, { above: null, below: null }, state)).toEqual([]);
  });
});
