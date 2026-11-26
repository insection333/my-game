// Session 261: what only the server makes (a climb on the ladders, the realm's boss fallen, a stage of the realm's
// work, a friend's cheer or gift) came over the live channel to the tray alone, so a cheer, promised as a small
// moment, was never one; it joins the page's moments now, as Castle Clash's battles always have.
import type { GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../../../packages/content/src/index.ts';
import { toldOf } from '../src/game/told.ts';

const T = Date.UTC(2026, 10, 26, 9);
describe('the server’s news', () => {
  it('is said as moments, and what the page played itself is not said again', () => {
    const news: GameEvent[] = [
      { type: 'cheered', at: T, from: 'Alder', occasion: 'rank', detail: 'woodcutting', place: 3 },
      { type: 'giftCame', at: T, from: 'Birch' },
      { type: 'rankUp', at: T, skill: 'total', place: 3, band: 3 },
      { type: 'realmFell', at: T, boss: 'ember-wyrm', week: '2026-11-23', strikes: 4 },
    ];
    const own: GameEvent = { type: 'levelUp', at: T, skill: 'woodcutting', level: 2 };
    expect(toldOf([...news, own])).toEqual(news);
  });
});
