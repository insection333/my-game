// A climb on a season's ladder said as one (session 165): its event names the ladder `season:N`, which has
// no skill's name or icon, and leads to the season's tab on Hiscores.
import { describe, expect, it } from 'vitest';
import { rankUpWords } from '../src/index.ts';

describe("a climb on a season's ladder", () => {
  it('names the season by its number and leads to its ladder', () => {
    const w = rankUpWords({ type: 'rankUp', at: 0, skill: 'season:2', place: 3, band: 3 });
    expect(w).toEqual({
      title: '3rd on the Season 2 ladder',
      body: 'Into the top three.',
      skill: null,
      href: '/hiscores?skill=season',
    });
  });
});
