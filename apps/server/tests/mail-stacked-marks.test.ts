// Marks stacked on a letter (session 286): a letter of a few letters each carrying a hundred combining marks
// ("Zalgo" text) passed the filter whole, and its marks are drawn above and below their line without taking
// room, over the letters before and after it in the inbox, which a griefer among friends could send to cover
// someone's inbox. A run of marks is now kept to three on a letter, as no language needs more, and the words
// of every language read as they were written.
import { describe, expect, it } from 'vitest';
import { cleanMessage } from '../src/mail/filter.ts';

const marks = (n: number) => Array.from({ length: n }, (_, i) => String.fromCodePoint(0x0300 + (i % 0x60))).join('');

describe('marks stacked on a letter', () => {
  it('keeps three to a letter at most', () => {
    const zalgo = `h${marks(120)}i${marks(80)}`;
    const cleaned = cleanMessage(zalgo)!;
    expect(cleaned.length).toBeLessThanOrEqual(8);
    expect(cleaned.startsWith('h')).toBe(true);
  });

  it('leaves the words of every language as written', () => {
    for (const words of ['Xin chào, bạn khỏe không?', 'नमस्ते, क्या हाल है?', 'Ça va très bien', 'שָׁלוֹם', 'كيف حالك'])
      expect(cleanMessage(words)).toBe(words.normalize('NFKC'));
  });
});
