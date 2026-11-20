// A find first found and found again in one absence is said once (session 157). The elder, back after a
// month, read "First Rare finds: Warlord's seal, Torn banner" and two lines below "Rare find: Warlord's
// seal", as though it were news twice; the first-find line now carries the count, and the lines of finds
// the log already held leave out those it did not hold when the player left.
import { newState, summarizeAway, type GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { recap } from '../src/index.ts';

const find = (at: number, item: string, rarity: 'uncommon' | 'rare', first: boolean): GameEvent => ({
  type: 'find',
  at,
  skill: 'woodcutting',
  item,
  rarity,
  first,
});

describe('a find first found and found again while away', () => {
  const before = newState(1, 0);
  const events = [
    find(1, 'warlords-seal', 'rare', true),
    find(2, 'torn-banner', 'rare', true),
    find(3, 'warlords-seal', 'rare', false),
    find(4, 'carved-acorn', 'rare', false),
    find(5, 'carved-acorn', 'rare', false),
    find(6, 'battle-trophy', 'uncommon', true),
    find(7, 'battle-trophy', 'uncommon', false),
    find(8, 'battle-trophy', 'uncommon', false),
    find(9, 'birds-nest', 'uncommon', false),
  ];
  const lines = recap.recapLines(summarizeAway(before, before, events, 8 * 3600_000));
  const texts = lines.map((l) => l.text);

  it('counts it on its first-find line', () => {
    expect(texts).toContain("First Rare finds: Warlord's seal ×2, Torn banner");
    expect(texts).toContain('First find: Battle trophy ×3 (Uncommon)');
  });

  it('leaves it out of the lines of finds the log already held', () => {
    expect(texts).not.toContain("Rare find: Warlord's seal");
    expect(texts).toContain('Rare find: Carved acorn ×2');
    expect(texts).toContain("An Uncommon find: Bird's nest");
  });
});
