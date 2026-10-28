// Feedback copied from the admin page reads on its own: what it is, then each note with who sent it,
// where they stood, the page and the day, and their words untouched.
import type { FeedbackView } from '@idle-clash/contracts';
import { describe, expect, it } from 'vitest';
import { feedbackNote, feedbackNotes } from '../src/pages/feedback-copy.ts';

const AT = Date.UTC(2026, 9, 27, 12);
const note = (over: Partial<FeedbackView> = {}): FeedbackView => ({
  name: 'Ashling',
  at: AT,
  page: '/skills/smithing',
  text: 'Loved the forge.\nThe fen was hard.',
  totalLevel: 1234,
  daysPlayed: 4,
  ...over,
});

describe('feedback copied from the admin page', () => {
  it('names the sender, where they stood, the page and the day, then their words', () => {
    const text = feedbackNote(note());
    expect(text.split('\n')[0]).toMatch(/^Ashling, total level 1,234, 4 days played, on \/skills\/smithing, .*2026:$/);
    expect(text.split('\n').slice(1).join('\n')).toBe('Loved the forge.\nThe fen was hard.');
    expect(feedbackNote(note({ daysPlayed: 1, name: null }))).toContain(
      'A deleted account, total level 1,234, 1 day played',
    );
  });

  it('puts every note under a line saying what they are, a blank line between', () => {
    const text = feedbackNotes([note(), note({ name: 'Brindle', text: 'More fish, please.' })]);
    const parts = text.split('\n\n');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toContain('newest first (2 notes)');
    expect(parts[2]).toMatch(/^Brindle.*\nMore fish, please\.$/);
    expect(feedbackNotes([note()]).split('\n\n')[0]).toContain('(1 note)');
  });
});
