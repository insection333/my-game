// A friend's cheer or gift in the recap (session 256): one that came while the player was away reached only the
// bell, so a gift waited unseen on the Hearth; both now stand in the away recap, the gift leading to its sheet.
import { newState, summarizeAway, type GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { recap } from '../src/index.ts';

const HOUR = 3_600_000;
const cheer = {
  type: 'cheered',
  at: 2 * HOUR,
  from: 'Alder',
  occasion: 'rank',
  detail: 'woodcutting',
  place: 3,
} as GameEvent;
const gift = { type: 'giftCame', at: 3 * HOUR, from: 'Birch' } as GameEvent;

describe("a friend's cheer and gift in the recap", () => {
  it('says both, from the notices, the gift leading to its sheet', () => {
    const before = newState(1, 0);
    const lines = recap.recapLines(summarizeAway(before, before, [], 8 * HOUR), [cheer, gift]);
    const texts = lines.map((l) => l.text);
    expect(texts).toContain('Alder cheered you. For reaching 3rd on the Woodcutting hiscores');
    expect(lines.find((l) => l.text.startsWith('Birch sent you a gift'))).toMatchObject({ href: '/?panel=gifts' });
  });
});
