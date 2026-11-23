// What lifts a skill's XP, said where it is earned (session 194): up to seven sources add to a skill's XP
// (the fire, Legendary marks, its relic, the steading, the edict, a Path, the season), each from another part
// of the game, and the skill's page showed the edict and the season alone, so a relic raised on Combat or a
// Training yard built on the Hearth lifted the XP an hour with no word of why. The head now says the whole
// lift and each source, from the very parts the engine sums.
import { fireXpPct, XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { woodcutting } from '../src/woodcutting/index.ts';
import { findsIn } from '../src/shared/catalog.ts';
import { xpBonusPct, xpParts } from '../src/shared/complete.ts';
import { seasonXpPct } from '../src/shared/season.ts';
import '../src/index.ts';

const T0 = Date.UTC(2026, 10, 23, 9);
const player = (): State => ({
  ...newState(3, T0),
  fireUntil: T0 + 300_000,
  fireSince: T0 - 600_000,
  skills: { woodcutting: { xp: XP_TABLE[50] } },
  features: {
    expeditions: {
      marks: 0,
      relics: { 'relic-woodcutting': 5 },
      drawn: 0,
      run: null,
      bossDay: {},
      wins: {},
      runs: {},
      twists: [],
    },
  },
});

describe("a skill's XP lifts", () => {
  it('are the parts the engine sums', () => {
    const s = player();
    const parts = xpParts(s, 'woodcutting', findsIn('woodcutting'), T0);
    expect(parts.reduce((n, p) => n + p.pct, 0)).toBeCloseTo(
      xpBonusPct(s, 'woodcutting', findsIn('woodcutting'), T0),
      9,
    );
    expect(parts.map((p) => p.source)).toEqual(['fire', 'relic', 'season']);
  });

  it("are said on the skill's head, each by name", () => {
    const head = woodcutting.slots['skill.header']({ state: player(), now: T0 }) as { gains: string | null };
    const fire = Math.round(fireXpPct(10) * 10) / 10;
    const total = fire + 5 + seasonXpPct('woodcutting', T0);
    expect(head.gains).toBe(`XP +${total}%: the fire +${fire}%, Heartwood charm +5%, The Greenwood +20%`);
    expect(
      (
        woodcutting.slots['skill.header']({ state: newState(3, Date.UTC(2026, 0, 1)), now: Date.UTC(2026, 0, 1) }) as {
          gains: string | null;
        }
      ).gains,
    ).toBeNull();
  });
});
