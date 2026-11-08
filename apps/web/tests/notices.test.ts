// The tray's notices (session 46): a siege or a spy against you names the lord behind it, whose profile
// card the notice offers; notices about anything else name no one.
import type { GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../../../packages/content/src/index.ts';
import { noticesOf } from '../src/pages/notices.ts';

const T = Date.UTC(2026, 10, 8, 9);

describe('a notice', () => {
  it('names the lord behind a siege or a spy against you, and no one otherwise', () => {
    const notices: GameEvent[] = [
      { type: 'castleBesieged', at: T, foe: 'Keeper', outcome: 'graze', lost: 120, marks: 3 },
      { type: 'castleSpyCaught', at: T + 1, foe: 'Ashgrove', marks: 2 },
      { type: 'castleTempered', at: T + 2, relic: 'war-horn', tempers: 3, masterstroke: false },
    ];
    const list = noticesOf({ notices, events: [] });
    expect(list.map((n) => n.who)).toEqual([undefined, 'Ashgrove', 'Keeper']);
  });

  it('reads deeds done together as one line, in the order done', () => {
    const deed = (at: number, name: string): GameEvent => ({
      type: 'deedDone',
      at,
      deed: name,
      name,
      icon: null,
      tier: 'easy',
      points: 5,
    });
    const notices = [
      deed(T, 'A castle raised'),
      deed(T + 1, 'Castle 10'),
      deed(T + 2, 'Tempered +3'),
      deed(T - 5 * 60_000, 'Pine 10'),
    ];
    const list = noticesOf({ notices, events: [] });
    expect(list.map((n) => n.text)).toEqual([
      'Deeds done: A castle raised, Castle 10 and Tempered +3',
      'Deed done: Pine 10',
    ]);
  });

  it('says a climb on the hiscores, and leads to that ladder', () => {
    const notices: GameEvent[] = [
      { type: 'rankUp', at: T, skill: 'fishing', place: 9, band: 10 },
      { type: 'rankUp', at: T + 1, skill: 'total', place: 3, band: 3 },
    ];
    expect(noticesOf({ notices, events: [] }).map((n) => [n.text, n.href, n.icon])).toEqual([
      ['3rd on the hiscores by total level. Into the top three.', '/hiscores', null],
      ['9th on the Fishing hiscores. Into the top ten.', '/hiscores?skill=fishing', 'fishing'],
    ]);
  });
});
