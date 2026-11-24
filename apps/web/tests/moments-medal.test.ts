// A moment's picture (session 224): its leading deed's medallion when it has no picture of its own, not the
// picture of another deed done in the same moment.
import '../src/late-icons.ts';
import { FEATURES } from '@idle-clash/features';
import type { GameEvent } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { momentsFrom } from '../src/shell/moments.ts';

const T = Date.UTC(2026, 9, 21, 9);

describe("a moment's picture", () => {
  it("wears the leading deed's medallion, not another deed's picture (session 224)", () => {
    const events: GameEvent[] = [
      {
        type: 'deedDone',
        at: T,
        deed: 'legends-3',
        name: 'Legends taken: 3',
        icon: null,
        tier: 'master',
        points: 100,
        mark: '3',
      },
      {
        type: 'deedDone',
        at: T + 40,
        deed: 'woodcutting-99',
        name: 'Woodcutting 99',
        icon: 'woodcutting',
        tier: 'hard',
        points: 15,
        mark: '99',
      },
    ];
    const [moment] = momentsFrom(events, T - 1, FEATURES);
    expect(moment.title).toBe('Deed done: Legends taken: 3');
    expect(moment.icon).toBeNull();
    expect(moment.medal).toEqual({ tier: 'master', mark: '3' });
  });
});
