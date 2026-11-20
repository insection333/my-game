// A newcomer's Next on the Deeds tab names deeds to start on (session 163). Nearest to done ranks deeds by
// what has been done towards each (session 73), so a newcomer, with nothing done towards any, read "Deeds
// you do appear here." under Next, a tab named for what comes next. It now names easy deeds to begin with,
// one a family, after any the player has begun.
import { newState } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { deeds } from '../src/deeds/index.ts';

const T0 = Date.UTC(2026, 10, 20, 9);
type View = { nearest: { name: string; tier: string }[] };
const view = (s = newState(1, T0)) => deeds.slots['hiscores.deeds']({ state: s, now: T0 }) as unknown as View;

describe("a newcomer's next deeds", () => {
  it('names easy deeds to begin with', () => {
    const next = view().nearest;
    expect(next.length).toBeGreaterThanOrEqual(4);
    expect(next.every((d) => d.tier === 'easy')).toBe(true);
    expect(new Set(next.map((d) => d.name)).size).toBe(next.length);
  });

  it('puts a deed begun first', () => {
    const s = { ...newState(1, T0), skills: { woodcutting: { xp: 1_000 } } };
    expect(view(s).nearest[0].name).toBe('Woodcutting 10');
  });
});
