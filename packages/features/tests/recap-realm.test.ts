// The realm's boss in the recap (session 190): the realm's boss falling while a player was away, their strike
// among the realm's, reached only the bell (the server tells it as a notice), and a strike fought in the lane
// while away said nothing at all, where a boss fought alone there has its line (session 72). Both now stand in
// the recap with the boss's picture, leading to where the share is taken.
import { newState, summarizeAway, type GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { recap } from '../src/index.ts';

const HOUR = 3_600_000;
const fell = { type: 'realmFell', at: 3 * HOUR, boss: 'ember-wyrm', week: '2026-11-23', strikes: 4 } as GameEvent;
const struck = { type: 'realmFought', at: 2 * HOUR, boss: 'ember-wyrm', won: true, gold: 900, marks: 2 } as GameEvent;

describe("the realm's boss in the recap", () => {
  it('says its fall while away, from the notices, and a strike fought in the lane', () => {
    const before = newState(1, 0);
    const lines = recap.recapLines(summarizeAway(before, before, [struck], 8 * HOUR), [fell]);
    const texts = lines.map((l) => l.text);
    expect(texts).toContain(recap.noticeLine(fell)!.text);
    expect(texts).toContain(recap.noticeLine(struck)!.text);
    expect(lines.find((l) => l.text === recap.noticeLine(fell)!.text)).toMatchObject({
      icon: 'ember-wyrm',
      href: '/combat/expeditions',
    });
  });

  it('leaves out a fall from before the absence', () => {
    const before = newState(1, 4 * HOUR);
    const lines = recap.recapLines(summarizeAway(before, before, [], 12 * HOUR), [fell]);
    expect(lines.map((l) => l.text)).not.toContain(recap.noticeLine(fell)!.text);
  });
});
