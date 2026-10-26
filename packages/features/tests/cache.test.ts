// Supply caches: half the goal's worth is certain, one draw adds more, and on average a cache is worth
// about what the goal paid before; a stocked cache holds food for a fighter, gold for anyone else.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { CACHE_DRAWS, cacheFor } from '../src/goals/cache.ts';

const T0 = Date.UTC(2026, 9, 20, 9);
const worthOf = (c: ReturnType<typeof cacheFor>) =>
  c.items.reduce((n, i) => n + (i.item === 'gold' ? i.count : i.count * (i.item === 'bread' ? 20 : 50)), 0);

describe('supply caches', () => {
  it('pay about what the goal paid, with every grade drawn as often as its chance', () => {
    const s = newState(5, T0);
    const caches = Array.from({ length: 4000 }, (_, n) => cacheFor(s, 1000, n));
    const mean = caches.reduce((n, c) => n + worthOf(c), 0) / caches.length;
    expect(mean).toBeGreaterThan(950);
    expect(mean).toBeLessThan(1150);
    for (const d of CACHE_DRAWS) {
      const share = caches.filter((c) => c.grade === d.grade).length / caches.length;
      expect(share, d.grade).toBeGreaterThan(d.chance * 0.8);
      expect(share, d.grade).toBeLessThan(d.chance * 1.2);
    }
    expect(Math.min(...caches.map((c) => c.items[0].count))).toBeGreaterThanOrEqual(500);
  });

  it('are the same on the page and the server: the draw is the save’s own', () => {
    const s = newState(9, T0);
    expect(cacheFor(s, 400, 7)).toEqual(cacheFor(structuredClone(s), 400, 7));
  });

  it('hold food for someone who fights, and its worth in gold for someone who does not', () => {
    const s = newState(5, T0);
    const n = Array.from({ length: 200 }, (_, i) => i).find((i) => cacheFor(s, 1000, i).grade === 'stocked')!;
    expect(cacheFor(s, 1000, n).items).toEqual([{ item: 'gold', count: 1000 }]);
    const fighter: State = {
      ...s,
      features: { combat: { worn: { weapon: 'copper-sword' }, health: null, healthAt: 0, retreated: null } },
    };
    expect(cacheFor(fighter, 1000, n).items).toEqual([
      { item: 'gold', count: 500 },
      { item: 'bread', count: 25 },
    ]);
  });
});
