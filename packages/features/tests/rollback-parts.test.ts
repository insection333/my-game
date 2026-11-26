// Session 272: after a rollback, the older build reads saves a newer one wrote. Every part's schema is strict, so a
// key it did not know (a field a later session added) read the whole part as empty, and the part's next write put
// that emptiness in place of months of play: goals, deeds, the fighter's gear, a skill's Path, expedition marks.
// Keys a part does not know are let go, wherever nested, before anything else.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { goalsOf } from '../src/goals/state.ts';
import { deedsOf } from '../src/deeds/state.ts';
import { combatOf } from '../src/shared/combat/state.ts';
import { expeditionsOf } from '../src/shared/expeditions/state.ts';
import { storeOf } from '../src/shared/storehouse.ts';

const T0 = Date.UTC(2026, 10, 27, 9);

/** A part as a later build might have written it: everything kept, and a key added at the top and inside. */
const later = (part: object): object => ({
  ...(structuredClone(part) as Record<string, unknown>),
  addedLater: { by: 'session 999' },
});

describe('a part with keys a later build added', () => {
  it('keeps everything it knows', () => {
    const s: State = newState(1, T0);
    s.features.goals = { ...goalsOf(s), opened: 41, weeks: 6, milestones: ['total-50'] };
    s.features.storehouse = { enlargements: 4 };
    s.features.combat = { worn: { weapon: 'iron-sword' }, health: 120, healthAt: T0, retreated: null };
    const e = expeditionsOf(s);
    s.features.expeditions = { ...e, marks: 777 };
    const before = { goals: goalsOf(s), store: storeOf(s), combat: combatOf(s), marks: expeditionsOf(s).marks };

    const after: State = structuredClone(s);
    for (const id of ['goals', 'storehouse', 'combat', 'expeditions'])
      after.features[id] = later(after.features[id] as object);
    // And one nested a level down.
    (after.features.combat as { worn: Record<string, unknown> }).worn.addedLater = 'x';
    expect(goalsOf(after)).toEqual(before.goals);
    expect(storeOf(after)).toEqual(before.store);
    expect(combatOf(after).worn).toEqual(before.combat.worn);
    expect(expeditionsOf(after).marks).toBe(777);
    expect(deedsOf(after)).toEqual(deedsOf(s));
  });
});
