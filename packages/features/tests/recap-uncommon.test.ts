// The recap's Uncommon finds, named and pictured (session 107): "9 Uncommon finds" stood on a bare dot, the
// one line of the recap without a picture, and named none of what was found.
import { newState, summarizeAway, type GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { recap } from '../src/index.ts';

const find = (at: number, item: string): GameEvent => ({
  type: 'find',
  at,
  skill: 'woodcutting',
  item,
  rarity: 'uncommon',
  first: false,
});

describe("the recap's Uncommon finds", () => {
  it('names the items found most, and wears the first', () => {
    const before = newState(1, 0);
    const events = [
      find(1, 'birds-nest'),
      find(2, 'amber-nugget'),
      find(3, 'birds-nest'),
      find(4, 'birds-nest'),
      find(5, 'amber-nugget'),
    ];
    const away = summarizeAway(before, before, events, 8 * 3600_000);
    const line = recap.recapLines(away).find((l) => l.kind === 'uncommon')!;
    expect(line).toMatchObject({ text: "5 Uncommon finds: Bird's nest ×3, Amber nugget ×2", icon: 'birds-nest' });
  });
});
