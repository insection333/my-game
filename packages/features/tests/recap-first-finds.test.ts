// Session 147's newcomer, back after eight hours, met five lines of first finds in the order they fell,
// three Uncommon above two Rare, and their levels (Woodcutting 15, Melee 14) out of sight under "And 14
// more". First finds now stand one line a rarity, the Rare first, so the levels show.
import { newState, summarizeAway, type GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { recap } from '../src/index.ts';

const find = (at: number, item: string, rarity: 'uncommon' | 'rare'): GameEvent => ({
  type: 'find',
  at,
  skill: 'woodcutting',
  item,
  rarity,
  first: true,
});
const level = (at: number, skill: string, to: number): GameEvent => ({ type: 'levelUp', at, skill, level: to });

describe("the recap's first finds", () => {
  const before = newState(1, 0);
  const events = [
    find(1, 'battle-trophy', 'uncommon'),
    find(2, 'birds-nest', 'uncommon'),
    find(3, 'carved-acorn', 'rare'),
    find(4, 'lucky-horseshoe', 'uncommon'),
    find(5, 'torn-banner', 'rare'),
    level(6, 'woodcutting', 15),
    level(7, 'mining', 5),
    level(8, 'melee', 14),
  ];
  const lines = recap.recapLines(summarizeAway(before, before, events, 8 * 3600_000));

  it('says them one line a rarity, the Rare first, each pictured by its first', () => {
    expect(lines.filter((l) => l.kind === 'newFind')).toEqual([
      expect.objectContaining({ text: 'First Rare finds: Carved acorn, Torn banner', icon: 'carved-acorn' }),
      expect.objectContaining({
        text: "First Uncommon finds: Battle trophy, Bird's nest, Lucky horseshoe",
        icon: 'battle-trophy',
      }),
    ]);
  });

  it('leaves room among the first five for the levels', () => {
    const kinds = recap
      .goodThings(lines)
      .slice(0, 5)
      .map((l) => l.kind);
    expect(kinds.slice(0, 4)).toEqual(['newFind', 'newFind', 'level', 'level']);
    // The highest levels first, where Mining 5 stood above Melee 14.
    expect(lines.filter((l) => l.kind === 'level').map((l) => l.text)).toEqual([
      'Woodcutting reached level 15',
      'Melee reached level 14',
      'Mining reached level 5',
    ]);
  });

  it('keeps a lone first find as it was', () => {
    const one = recap.recapLines(summarizeAway(before, before, [find(1, 'carved-acorn', 'rare')], 3600_000));
    expect(one.find((l) => l.kind === 'newFind')?.text).toBe('First find: Carved acorn (Rare)');
  });
});
