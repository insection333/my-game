// A row's place in the lanes, said on it (session 124): pressing Next on Iron key while Iron bar ran only
// greyed Next on the row, which reads as "not available"; nothing said Iron key was next. The running row
// says "In your lane", a queued one now "Next in your lane".
import { actionRegistry, FEATURES } from '@idle-clash/features';
import { XP_TABLE } from '@idle-clash/content';
import { createEngine, newState, seeded, type Command, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { laneStatus } from '../src/pages/lane-status.ts';
import { queuedAt } from '../src/pages/NextButton.tsx';
import { laneViews } from '../src/shell/Lanes.tsx';

const T0 = Date.UTC(2026, 10, 17, 9);
const engine = createEngine(actionRegistry(FEATURES, () => true));
const run = (s: State, c: Command) => engine.command(s, T0, c, seeded(1)).state;
const bar = { feature: 'smithing', id: 'copper-bar' };
const sword = { feature: 'smithing', id: 'copper-sword' };

describe("a row's place in the lanes", () => {
  it('is working, next, or neither', () => {
    let s: State = { ...newState(1, T0), skills: { smithing: { xp: XP_TABLE[5] } }, items: { 'copper-ore': 50 } };
    s = run(s, { type: 'start', lane: 'artisan', action: bar });
    s = run(s, { type: 'queueNext', lane: 'artisan', action: sword });
    expect(s.lanes.artisan.next).toEqual(sword);
    expect(laneStatus(s, bar)).toBe('In your lane');
    expect(laneStatus(s, sword)).toBe('Next in your lane');
    expect(laneStatus(s, { feature: 'smithing', id: 'copper-staff' })).toBeNull();
  });

  // Session 240: a lane holds three to come; each says so on its row, and the lane names them in order.
  it('says every one of three to come, and where it waits', () => {
    const staff = { feature: 'smithing', id: 'copper-staff' };
    const bow = { feature: 'smithing', id: 'copper-bow' };
    let s: State = { ...newState(1, T0), skills: { smithing: { xp: XP_TABLE[9] } }, items: { 'copper-ore': 50 } };
    s = run(s, { type: 'start', lane: 'artisan', action: bar });
    for (const action of [sword, staff, bow]) s = run(s, { type: 'queueNext', lane: 'artisan', action });
    expect([sword, staff, bow].map((a) => laneStatus(s, a))).toEqual(Array(3).fill('Next in your lane'));
    expect(queuedAt(s, bow)).toEqual({ lane: 'artisan', at: 2 });
    expect(queuedAt(s, bar)).toBeNull();
    const artisan = laneViews(s, T0).find((l) => l.id === 'artisan')!;
    expect(artisan.note).toBe('Next: Copper sword, then Copper staff, then Copper bow');
    expect(artisan.queued).toBe(true);
  });
});
