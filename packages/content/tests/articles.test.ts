// "a" or "an" before a placeholder (session 102): the word that fills it decides which is right, and
// "Needs a iron key", "A 8 h run" and "a 800 bounty" were written. No string sets an article before one.
import { describe, expect, it } from 'vitest';
import { allStringKeys, templateOf } from '../src/index.ts';

describe('the strings', () => {
  it('never set "a" or "an" before a placeholder', () => {
    const before = allStringKeys().filter((k) => /\b[Aa]n? \{/.test(templateOf(k) ?? ''));
    expect(before).toEqual([]);
  });
});
