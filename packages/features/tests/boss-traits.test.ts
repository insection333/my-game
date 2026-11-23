// Each boss fights its own way (session 211, the plan *Dead and short content, 23 November*): a boss was a
// foe with ten times the health, so the only thing to prepare was food. Each now has a trait the fight
// plays and Your odds counts, answered by preparing for it, and each still falls to the style that beats it
// at its tier's top with food, nine fights in ten.
import { describe, expect, it } from 'vitest';
import { STYLES, type Style } from '@idle-clash/content';
import { BOSSES, bossById, type Boss } from '../src/shared/expeditions/data.ts';
import { BEATS, FOODS } from '../src/shared/combat/data.ts';
import { oddsFor } from '../src/shared/combat/odds.ts';
import { fight } from '../src/shared/combat/fight.ts';
import { fighterOf, mealsOf } from '../src/shared/combat/state.ts';
import { seeded, type State } from '@idle-clash/kernel';
import { fighterOfLevel } from './helpers/expedition.ts';

const beater = (style: Style): Style => STYLES.find((s) => BEATS[s] === style)!;
const at = (b: Boss, style: Style) => fighterOfLevel(Math.min(99, b.level - 1), 1, style);
const plain = (b: Boss): Boss => ({ ...b, trait: undefined });
/** A hundred fights of a boss from full health with plenty of food: how many fall, the seconds and food. */
function hundred(s: State, b: Boss) {
  const p = fighterOf(s, b)!;
  const r = seeded(9);
  let i = 0;
  let [won, secs, food] = [0, 0, 0];
  for (let k = 0; k < 100; k++) {
    const f = fight(p, b, () => r('x', i++), 1e9, mealsOf(s));
    won += f.retreated ? 0 : 1;
    secs += f.seconds;
    food += Object.values(f.eaten).reduce((a, n) => a + n, 0);
  }
  return { won, secs, food };
}

describe("each boss's own way", () => {
  it('each has one, and still falls to the style that beats it at its tier with food', () => {
    for (const b of BOSSES) {
      expect(b.trait, b.id).toBeDefined();
      const odds = oddsFor(at(b, beater(b.style)), b)!;
      expect(odds.retreatRate, b.id).toBeLessThanOrEqual(0.1);
    }
  });

  it('the Troll-chief rages below half health, so a fight against it eats more', () => {
    const b = bossById('troll-chief')!;
    const s = at(b, beater(b.style));
    expect(hundred(s, b).food).toBeGreaterThan(hundred(s, plain(b)).food * 1.05);
  });

  it('the Drowned Warden takes a full blow only from the style that beats it', () => {
    const b = bossById('drowned-warden')!;
    const even = at(b, b.style);
    expect(hundred(even, b).secs).toBeGreaterThan(hundred(even, plain(b)).secs * 1.4);
    const right = at(b, beater(b.style));
    expect(hundred(right, b).secs).toBe(hundred(right, plain(b)).secs);
  });

  it('the Storm-roc turns hits aside unless a supply is carried', () => {
    const b = bossById('storm-roc')!;
    const s = at(b, beater(b.style));
    const bare = hundred(s, b).secs;
    expect(bare).toBeGreaterThan(hundred(s, plain(b)).secs * 1.25);
    const supplied = { ...s, items: { ...s.items, 'embersteel-whetstones': 1_000 } };
    expect(hundred(supplied, b).secs).toBeLessThan(bare * 0.75);
  });

  it('the Barrow-king rises at a third, the Mire-mother mends, the Ember Wyrm takes wing: each a longer fight', () => {
    for (const id of ['barrow-king', 'mire-mother', 'ember-wyrm']) {
      const b = bossById(id)!;
      const s = at(b, beater(b.style));
      expect(hundred(s, b).secs, id).toBeGreaterThan(hundred(s, plain(b)).secs * 1.05);
    }
  });

  it('are said in the arena as they turn', () => {
    const b = bossById('troll-chief')!;
    const p = fighterOf(at(b, beater(b.style)), b)!;
    const r = seeded(3);
    let i = 0;
    const said: string[] = [];
    fight(
      p,
      b,
      () => r('x', i++),
      1e9,
      [{ item: FOODS[0].id, heals: 100, count: 1e6 }],
      {},
      (x) => {
        if (x.by === 'trait') said.push(x.trait);
      },
    );
    expect(said).toEqual(['rage']);
  });
});
