// The season said (session 164): the Hearth names it, what it lifts and the days left, and the season to come
// in its last week; a skill's page and Combat carry a pill only where the twist lifts something there.
import { describe, expect, it } from 'vitest';
import { seasonPill, seasonView } from '../src/index.ts';
import { SEASON_DAYS, SEASON_EPOCH, TWISTS } from '../src/shared/season.ts';

const DAY = 86_400_000;
const inSeason = (id: string, day = 1) =>
  SEASON_EPOCH + TWISTS.findIndex((t) => t.id === id) * SEASON_DAYS * DAY + day * DAY + 3_600_000;

describe('the season said', () => {
  it('names the season, what it lifts and the days it has left', () => {
    const v = seasonView(inSeason('greenwood', 18))!;
    expect(v.title).toBe('Season 1: The Greenwood');
    expect(v.gives).toBe('Gathering skills earn 20% more XP');
    expect(v.left).toBe('38 days left');
    expect(v.next).toBe('');
    expect(seasonView(SEASON_EPOCH - DAY)).toBeNull();
  });

  it('names the season to come in its last week, and its last day as such', () => {
    expect(seasonView(inSeason('greenwood', 50))!.next).toBe('Next: The Forgefire');
    expect(seasonView(inSeason('greenwood', 55))!.left).toBe('Its last day');
  });

  it('carries a pill only where the twist lifts something', () => {
    expect(seasonPill(inSeason('greenwood'), { skill: 'mining' })).toBe('The Greenwood: +20% XP');
    expect(seasonPill(inSeason('greenwood'), { skill: 'cooking' })).toBeNull();
    expect(seasonPill(inSeason('greenwood'), { combat: true })).toBeNull();
    expect(seasonPill(inSeason('muster'), { combat: true })).toBe('The Muster: +20% XP');
    expect(seasonPill(inSeason('road'), { combat: true })).toBe('The Open Road: +25% marks');
    expect(seasonPill(inSeason('road'), { skill: 'mining' })).toBeNull();
    expect(seasonPill(inSeason('plenty'), { skill: 'fishing' })).toBe('The Plenty: +10% items');
    expect(seasonPill(inSeason('omens'), { skill: 'cooking' })).toBe(
      'The Omens: Rare and Legendary finds 30% likelier',
    );
  });

  it('names every twist and what it gives', () => {
    for (const twist of TWISTS) {
      const v = seasonView(inSeason(twist.id))!;
      expect(v.title).toMatch(/^Season \d+: The /);
      expect(v.gives).toMatch(/\d+%/);
    }
  });
});
