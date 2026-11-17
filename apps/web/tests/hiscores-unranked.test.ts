// Why a player is not on a ladder, said for the ladder shown (session 128): on Castles a player with no
// castle read "Your rank appears after your first level", a skill ladder's words; a castle is ranked once
// it is raised.
import { describe, expect, it } from 'vitest';
import { unrankedNote } from '../src/pages/hiscores-words.ts';

describe('an unranked player', () => {
  it('is told what puts them on the ladder shown', () => {
    expect(unrankedNote('castle')).toBe('Your castle is ranked once it is raised.');
    expect(unrankedNote('total')).toBe('Your rank appears after your first level.');
    expect(unrankedNote('mining')).toBe('Your rank appears after your first level.');
  });
});
