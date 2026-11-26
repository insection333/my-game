// Session 269: a work's later stages ask for Uncommon finds of the skills it serves ("Wild herbs ×240"), and said
// nothing of where they are found; a player at 99 who had left Cooking never met them, and the two-year player's
// Smokehouse waited on 0 of 240. A find still short says where it comes from, as the collection log does.
import { newState } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { steadingView } from '../src/steading/view.ts';

const costs = (stage: number, work: string, items: Record<string, number> = {}) => {
  const s = newState(1, 0);
  s.features.steading = { stages: { [work]: stage } };
  s.items = items;
  return steadingView(s).rows.find((r) => r.id === work)!.next!.cost;
};

describe("a work's finds", () => {
  it('say where they are found while short, a fight style by its foes', () => {
    const smoke = costs(5, 'smokehouse');
    expect(smoke.find((c) => c.label.startsWith('Wild herbs'))?.from).toBe('Any Cooking action');
    const watch = costs(5, 'watchtower');
    expect(watch.find((c) => c.label.startsWith('Goose fletchings'))?.from).toBe('Any foe fought with Archery');
    // The greater finds at the tenth: their tier too.
    const tenth = costs(9, 'smokehouse');
    expect(tenth.find((c) => c.label.startsWith('Saffron threads'))?.from).toBe('Any Cooking action, tier 3 and up');
    // Held in full, or a material or gold: nothing said.
    expect(
      costs(5, 'smokehouse', { 'wild-herbs': 10_000 }).find((c) => c.label.startsWith('Wild herbs'))?.from,
    ).toBeNull();
    expect(smoke.filter((c) => !/herbs|mussel/i.test(c.label)).every((c) => c.from === null)).toBe(true);
  });
});
