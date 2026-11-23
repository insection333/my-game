// Companions (session 179): each joins a save at a point drawn from its seed, within its span (a skill's
// levels 30 to 90, a boss's first thirty wins); its deed is done once it has, and it may then be shown
// beside the picture, and not before.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { refresh, choose } from '../src/deeds/rules.ts';
import { shownHonours } from '../src/deeds/honours.ts';
import { companionAt, companionById, companionFound, COMPANIONS } from '../src/shared/companions.ts';

const T0 = Date.UTC(2026, 10, 23, 9);
const squirrel = companionById('squirrel')!;
const whelp = companionById('stone-whelp')!;
const withXp = (seed: number, xp: number): State => ({ ...newState(seed, T0), skills: { woodcutting: { xp } } });

describe('companions', () => {
  it('joins each save within its span, at a point of its own', () => {
    const points = Array.from({ length: 200 }, (_, seed) => companionAt({ seed }, squirrel));
    expect(Math.min(...points)).toBeGreaterThanOrEqual(XP_TABLE[30]);
    expect(Math.max(...points)).toBeLessThanOrEqual(XP_TABLE[90]);
    expect(new Set(points).size).toBeGreaterThan(150);
    const wins = Array.from({ length: 200 }, (_, seed) => companionAt({ seed }, whelp));
    expect(Math.min(...wins)).toBeGreaterThanOrEqual(5);
    expect(Math.max(...wins)).toBeLessThanOrEqual(30);
    expect(COMPANIONS).toHaveLength(17);
  });

  it('joins at its point and not before, its deed done and then shown', () => {
    const at = companionAt({ seed: 7 }, squirrel);
    expect(companionFound(withXp(7, at - 1), squirrel)).toBe(false);
    const before = refresh(withXp(7, at - 1), T0).state;
    expect(choose(before, 'companion', 'squirrel').result).toEqual({ ok: false, reason: 'locked' });
    const out = refresh(withXp(7, at), T0);
    expect(out.events.some((e) => e.type === 'deedDone' && e.deed === 'companion-squirrel')).toBe(true);
    const shown = choose(out.state, 'companion', 'squirrel');
    expect(shown.result).toEqual({ ok: true });
    expect(shownHonours(shown.state).companion).toBe('squirrel');
    expect(shownHonours(choose(shown.state, 'companion', null).state).companion).toBeNull();
  });
});
