// How a relic reads (session 85): what it gives now once raised, and what each rank gives while unraised,
// where "Heartwood charm: +1% Woodcutting XP, Rank 0 of 5" read as though it already gave that.
import { newState } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { relicsView } from '../src/expeditions/relics-view.ts';
import '../src/index.ts'; // every skill registered, so every skill has its relic
import { expeditionsOf, setExpeditions } from '../src/shared/expeditions/state.ts';

const row = (rank: number, id = 'relic-woodcutting') => {
  const s = newState(1, 0);
  if (rank) setExpeditions(s, { ...expeditionsOf(s), relics: { [id]: rank } });
  return relicsView(s).relics.find((r) => r.id === id)!;
};

describe('a relic row', () => {
  it('says what each rank gives while it has none', () => {
    expect(row(0)).toMatchObject({ rank: 'Rank 0 of 5', effect: '+1% Woodcutting XP a rank' });
    expect(row(0, 'four-leaf-charm').effect).toMatch(/ a rank$/);
  });

  it('says what it gives now once raised', () => {
    expect(row(1).effect).toBe('+1% Woodcutting XP');
    expect(row(3).effect).toBe('+3% Woodcutting XP');
  });
});
