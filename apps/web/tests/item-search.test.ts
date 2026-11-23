// Finding an item in the Storehouse (session 186): a player a year in holds up to 192 kinds of item in
// panels by kind, and nothing found one but scrolling. Every word typed begins a word of the name, in any
// case, without apostrophes or accents.
import { describe, expect, it } from 'vitest';
import { itemMatches, SEARCH_FROM } from '../src/pages/item-search.ts';

describe('the Storehouse search', () => {
  it('finds a name by the start of its words, in any case, apostrophes and accents aside', () => {
    expect(itemMatches("Bird's nest", 'nest')).toBe(true);
    expect(itemMatches("Bird's nest", 'ne')).toBe(true);
    expect(itemMatches('Silverbark logs', 'bar')).toBe(false);
    expect(itemMatches('Star-iron bar', 'iron')).toBe(true);
    expect(itemMatches("Bird's nest", 'BIRDS')).toBe(true);
    expect(itemMatches("Bird's nest", 'bird nest')).toBe(true);
    expect(itemMatches('Copper bar', ' copper  ')).toBe(true);
    expect(itemMatches('Moonsilver ore', 'moonsilvér')).toBe(true);
  });

  it('asks every word, and an empty search shows everything', () => {
    expect(itemMatches('Copper bar', 'copper ore')).toBe(false);
    expect(itemMatches('Copper bar', 'iron')).toBe(false);
    expect(itemMatches('Copper bar', '')).toBe(true);
  });

  it('is offered once the shelves are long enough to need it', () => {
    expect(SEARCH_FROM).toBeGreaterThan(24);
  });
});
