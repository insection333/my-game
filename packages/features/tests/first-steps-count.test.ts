// The first steps' count says the steps done (session 129): with "Chop a pine" and "Mine copper ore" done
// and each offering Claim 25 gold, the panel said "0 of 6 done", counting only steps whose gold was taken.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../src/index.ts';

const T0 = Date.UTC(2026, 10, 17, 9);
const progress = (s: State) => {
  const goals = FEATURES.find((f) => f.id === 'goals')!;
  return (goals.slots['hearth.goals']({ state: s, now: T0 }) as unknown as { progress: string }).progress;
};

describe('the first steps', () => {
  it('count a step done once it is done, its gold claimed or not', () => {
    const s = newState(1, T0);
    expect(progress(s)).toBe('0 of 6 done');
    const done: State = { ...s, mastery: { 'woodcutting:pine-tree': 1, 'mining:copper-vein': 1 } };
    expect(progress(done)).toBe('2 of 6 done');
  });
});
