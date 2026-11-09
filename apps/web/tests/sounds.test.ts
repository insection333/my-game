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
    // The castle's battles (session 64): they were silent.
    expect(cueFor({ type: 'castleSiege', at, foe: 'X', outcome: 'graze', gold: 1, marks: 1 })).toBe('goal');
    expect(cueFor({ type: 'castleSiege', at, foe: 'X', outcome: 'decisive', gold: 1, marks: 1, rout: true })).toBe(
      'rare',
    );
    expect(cueFor({ type: 'castleSiege', at, foe: 'X', outcome: 'repelled', gold: 0, marks: 0 })).toBeNull();
    expect(cueFor({ type: 'castleBesieged', at, foe: 'X', outcome: 'repelled', lost: 0, marks: 4 })).toBe('goal');
    expect(cueFor({ type: 'castleBesieged', at, foe: 'X', outcome: 'graze', lost: 9, marks: 0 })).toBe('stopped');
    expect(cueFor({ type: 'castleTempered', at, relic: 'aegis-shard', tempers: 2, masterstroke: true })).toBe('rare');
    expect(cueFor({ type: 'castleIncursion', at, fortress: 'f', tier: 3, won: true, marks: 9, spoils: 'hoard' })).toBe(
      'rare',
    );
    expect(cueFor({ type: 'castleOrders', at, orders: ['spy'], all: false, marks: 3 })).toBe('goal');
    // First on a ladder rings like a Rare find; any other climb, the goal's chime.
    expect(cueFor({ type: 'rankUp', at, skill: 'total', place: 1, band: 1 })).toBe('rare');
    expect(cueFor({ type: 'rankUp', at, skill: 'mining', place: 7, band: 10 })).toBe('goal');
    expect(bestCue([])).toBeNull();
  });

  it('knocks by the kind of work', () => {
    expect([workCue('woodcutting'), workCue('mining'), workCue('melee')]).toEqual(['chop', 'strike', 'hit']);
    expect([workCue('fishing'), workCue('cooking')]).toEqual(['splash', 'sizzle']);
    expect([workCue('fletching'), workCue('runecraft')]).toEqual(['chop', 'strike']);
  });
});
