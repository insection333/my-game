// A stronghold's row says what holds it (session 136): the day's five are ranked by what they pay, yet a
// new lord saw the easiest at 79% to win beside the next two at 100%, with nothing to say why. Its
// garrison and trap decide it, so the row names them: where the garrison is strongest, and its trap.
import { describe, expect, it } from 'vitest';
import { garrisonWords } from '../src/pages/castle/labels.ts';

describe("a stronghold's garrison, said", () => {
  it('names where it is strongest and the trap at its gate', () => {
    expect(garrisonWords([20, 40, 40], 'counter-battery')).toBe(
      'Strongest in Outriders and Siege; Counter-battery at the gate',
    );
    expect(garrisonWords([60, 20, 20], 'boiling-pitch')).toBe('Strongest in Vanguard; Boiling pitch at the gate');
    expect(garrisonWords([50, 30, 20], 'spiked-palisades')).toBe('Strongest in Vanguard; Spiked palisades at the gate');
  });

  it('calls an even garrison even', () => {
    expect(garrisonWords([34, 33, 33], 'boiling-pitch')).toBe('An even garrison; Boiling pitch at the gate');
  });
});
