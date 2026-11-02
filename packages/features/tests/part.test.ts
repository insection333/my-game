// A feature's part of a save is read once per object (session 37): the same object reads the same, a
// replaced one is read afresh, a missing or unreadable one is the empty part, and what was read cannot be
// changed by its reader.
import { newState } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { goalsOf } from '../src/goals/state.ts';
import { steadingOf } from '../src/shared/steading.ts';
import { storeOf } from '../src/shared/storehouse.ts';

const T0 = Date.UTC(2026, 10, 2);

describe('a part of a save', () => {
  it('is read once per object, and afresh when replaced', () => {
    const s = newState(1, T0);
    s.features.steading = { stages: { woodyard: 2 } };
    const first = steadingOf(s);
    expect(first.stages.woodyard).toBe(2);
    expect(steadingOf(s)).toBe(first);
    s.features.steading = { stages: { woodyard: 3 } };
    expect(steadingOf(s).stages.woodyard).toBe(3);
  });

  it('is empty when missing or unreadable', () => {
    const s = newState(1, T0);
    expect(storeOf(s)).toEqual({ enlargements: 0 });
    s.features.storehouse = { enlargements: -4 };
    expect(storeOf(s)).toEqual({ enlargements: 0 });
    expect(goalsOf(s).claimed).toEqual([]);
  });

  it('cannot be changed by its reader', () => {
    const s = newState(1, T0);
    s.features.goals = { claimed: ['chop-a-pine'] };
    const g = goalsOf(s);
    expect(() => g.claimed.push('mine-copper-ore')).toThrow();
    expect(() => {
      (g as { made: number }).made = 9;
    }).toThrow();
    expect(goalsOf(s).claimed).toEqual(['chop-a-pine']);
  });
});
