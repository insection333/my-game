// Which sound goes with what: a soft cue for each moment, the best when several land together, and
// nothing for what comes by the dozen (Uncommon finds the log holds) or what the player did.
import type { GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { bestCue, cueFor, workCue } from '../src/sound/cues.ts';

const at = 1;
const find = (rarity: 'uncommon' | 'rare' | 'legendary', first = false): GameEvent => ({
  type: 'find',
  at,
  skill: 'woodcutting',
  item: 'birds-nest',
  rarity,
  first,
});
const pine = { feature: 'woodcutting', id: 'pine-tree' };

describe('sound cues', () => {
  it('stays quiet for what repeats or what the player did', () => {
    expect(cueFor(find('uncommon'))).toBeNull();
    expect(
      cueFor({ type: 'laneStopped', at, lane: 'gathering', action: pine, reason: { code: 'stoppedByPlayer' } }),
    ).toBeNull();
    expect(cueFor({ type: 'refused', at, lane: 'gathering', action: pine, reason: { code: 'locked' } })).toBeNull();
  });

  it('gives each moment its cue, and the best of several', () => {
    expect(cueFor(find('uncommon', true))).toBe('newFind');
    expect(cueFor(find('rare'))).toBe('rare');
    expect(
      bestCue([
        { type: 'goalDone', at, goal: 'chop-a-pine' },
        { type: 'levelUp', at, skill: 'woodcutting', level: 2 },
        { type: 'masteryStep', at, action: pine, step: 1 },
      ]),
    ).toBe('level');
    expect(bestCue([find('rare'), find('legendary')])).toBe('legendary');
    expect(bestCue([])).toBeNull();
  });

  it('knocks by the kind of work', () => {
    expect([workCue('woodcutting'), workCue('mining'), workCue('melee')]).toEqual(['chop', 'strike', 'hit']);
    expect([workCue('fishing'), workCue('cooking')]).toEqual(['splash', 'sizzle']);
  });
});
