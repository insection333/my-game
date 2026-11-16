// A run that stopped by itself, said on its own card (session 120): with the Storehouse full a run stood at
// "Stage 9 of 9" offering Carry on, which the engine refused without a word, and only the lane's chip
// said why. The card now says why it stopped, offers what puts it right, and Carry on once it would go.
import { describe, expect, it } from 'vitest';
import type { State } from '@idle-clash/kernel';
import { runStopped } from '../src/pages/run-stopped.ts';

const at = (stopped: State['lanes']['combat']['stopped']) =>
  ({ lanes: { combat: { current: null, next: null, stopped } } }) as unknown as State;
const march = { feature: 'expeditions', id: 'march' };
const full = { reason: { code: 'storehouseFull' }, at: 0, action: march };

describe("a run's card", () => {
  it('says why the run stopped and what puts it right, without Carry on while it would be refused', () => {
    expect(runStopped(at(full), 'march', () => false)).toEqual({
      why: 'Storehouse full',
      fix: { label: 'Make room', path: '/storehouse' },
      again: false,
    });
  });

  it('offers Carry on once the engine would take the run again', () => {
    expect(runStopped(at(full), 'march', () => true)?.again).toBe(true);
  });

  it('says nothing of a stop on another action, or one the player made', () => {
    expect(
      runStopped(at({ ...full, action: { feature: 'combat', id: 'orc-raider' } }), 'march', () => false),
    ).toBeNull();
    expect(
      runStopped(at({ reason: { code: 'stoppedByPlayer' }, at: 0, action: march }), 'march', () => false),
    ).toBeNull();
    expect(runStopped(at(null), 'march', () => true)).toBeNull();
  });
});
