// How near a locked honour is (session 77): a foe's picture, grey until a hundred are slain, said only its
// name; the note said "a hundred", but not whether the player had slain three or ninety-seven. A locked
// honour opened by a counted deed now says how far that deed is ("47 of 100").
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { honoursView } from '../src/deeds/honours-view.ts';

const T0 = Date.UTC(2026, 10, 11, 9);
const state: State = { ...newState(1, T0), mastery: { 'combat:hollow-rat': 47 } };
const picture = (s: State, id: string) =>
  honoursView(s, T0)
    .choices.find((c) => c.kind === 'picture')!
    .options.find((o) => o.id === id)!;

describe('how near a locked honour is', () => {
  it("is the deed's count, for a foe's picture", () => {
    expect(picture(state, 'hollow-rat')).toMatchObject({ open: false, progress: '47 of 100' });
    expect(picture(state, 'goblin-slinger').progress).toBe('0 of 100');
  });

  it('is nothing for what is open, and never past the deed', () => {
    expect(picture(state, 'forester').progress).toBeNull();
    // A hundred slain, the deed not yet recorded (the page records it as it opens): full, not past it.
    expect(picture({ ...state, mastery: { 'combat:hollow-rat': 140 } }, 'hollow-rat').progress).toBe('100 of 100');
  });
});
