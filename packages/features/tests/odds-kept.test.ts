// Session 272: Your odds were kept in one map emptied whole at 500 entries, and the realm's boss alone asks about
// twenty a player, so a realm of some twenty players emptied it again and again, each time playing a thousand
// fights a foe afresh (200 ms on the server's one thread for a player two years in). The least lately asked go.
import { describe, expect, it } from 'vitest';
import { FOES } from '../src/shared/combat/data.ts';
import { oddsFor, oddsPlayed } from '../src/shared/combat/odds.ts';
import { fighterOfLevel } from './helpers/expedition.ts';

describe("Your odds' memory", () => {
  it('keeps what was asked lately past five hundred fighters and foes', () => {
    const foes = FOES.slice(0, 2);
    // Against a foe none after it is asked about.
    const first = fighterOfLevel(40, 1, 'melee');
    const lone = FOES[5];
    oddsFor(first, lone);
    // Three hundred other fighters, each against two foes: six hundred more.
    for (let level = 1; level <= 100; level++)
      for (const style of ['melee', 'archery', 'magic'] as const)
        for (const f of foes) oddsFor(fighterOfLevel(Math.min(99, level), 2, style), f);
    const played = oddsPlayed();
    expect(played).toBeGreaterThan(500);
    oddsFor(first, lone);
    expect(oddsPlayed()).toBe(played);
  });
});
