// Castle Clash on the Hearth's Next up (session 167): before it opens, how far off it is, closing the list;
// once it can be raised, that it is ready, leading it.
import { XP_TABLE } from '@idle-clash/content';
import { allSkills } from '@idle-clash/features';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { castleNote } from '../src/pages/HearthCastle.tsx';

const T0 = Date.UTC(2026, 10, 22, 9);
/** A save at a total level: every skill at 1, the first `extra` levels on woodcutting. */
const at = (total: number): State => {
  const s = newState(1, T0);
  const ones = allSkills().length;
  return { ...s, skills: { ...s.skills, woodcutting: { xp: XP_TABLE[1 + total - ones] } } };
};

describe('Castle Clash on the Hearth', () => {
  it('says how far off it opens, then that the castle is ready to raise', () => {
    expect(castleNote(at(11), T0)).toEqual({ text: 'Opens at total level 30: 19 levels away', first: false });
    expect(castleNote(at(29), T0)).toEqual({ text: 'Opens at total level 30: 1 level away', first: false });
    expect(castleNote(at(30), T0)).toEqual({ text: 'Your castle is ready to raise', first: true });
  });
});
