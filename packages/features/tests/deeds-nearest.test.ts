// The deeds nearest to done (session 73), as a newcomer sees them: a new save already holds 24 Storehouse
// spaces and a total level of eleven, so "Builder I: 24 of 30" led the list at 80% and "Settler" at 55%
// before the player had done a thing (the next spaces cost 40,000 gold). What every save starts with is
// now no progress: the list ranks by what the player has done towards each deed.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { deedsView } from '../src/deeds/view.ts';

const T0 = Date.UTC(2026, 10, 11, 9);

describe('the deeds nearest to done', () => {
  it('are none for a newcomer who has done nothing', () => {
    expect(deedsView(newState(1, T0), T0).nearest).toEqual([]);
  });

  it('are what the player has moved, led by the most done of it', () => {
    const s: State = { ...newState(1, T0), skills: { woodcutting: { xp: XP_TABLE[4] } } };
    const nearest = deedsView(s, T0).nearest;
    expect(nearest.length).toBeGreaterThan(0);
    expect(nearest.map((d) => d.name)).not.toContain('Builder I');
    expect(nearest[0].name).toMatch(/Woodcutting|Settler/);
  });
});
