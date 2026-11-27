// A Storehouse holding more kinds than its spaces says why (session 162). A find is never lost: it is kept
// even when every space is taken, so a full Storehouse can hold one kind more than it has spaces, and the
// count read "25 of 24 slots", as though the count were wrong.
import { newState } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { FEATURES } from '../src/index.ts';
import { storehouse } from '../src/storehouse/index.ts';
import { START_SLOTS } from '../src/shared/storehouse.ts';

const T0 = Date.UTC(2026, 10, 20, 9);
// Kinds the game has: an item it no longer has takes no space (session 284).
const KINDS = FEATURES.flatMap((f) => f.content.items ?? []).filter((i) => i.kind === 'resource');
const holding = (kinds: number) => ({
  ...newState(1, T0),
  items: Object.fromEntries(KINDS.slice(0, kinds).map((i) => [i.id, 1])),
});
const text = (kinds: number) =>
  (storehouse.slots['store.capacity']({ state: holding(kinds), now: T0 }) as unknown as { text: string }).text;

describe('the Storehouse count', () => {
  it('reads as ever while the spaces hold', () => {
    expect(text(START_SLOTS)).toBe(`${START_SLOTS} of ${START_SLOTS} slots`);
  });

  it('says a find was kept past the last space', () => {
    expect(text(START_SLOTS + 1)).toBe(`${START_SLOTS + 1} of ${START_SLOTS} slots: finds are kept even when full`);
  });
});
