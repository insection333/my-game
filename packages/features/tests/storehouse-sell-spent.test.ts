// Rare finds with no use left, sold with the rest (session 192): a Rare find's one use is mastery on its
// skill's actions; once every one of them is open and at full mastery its panel says it is kept to sell,
// yet Sell finds (session 187) took only the Uncommon, so a player a year in sold their acorns one panel at a
// time. They are sold with the rest now; a Rare find with an action still to master, or still to open,
// is kept.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { skillActions } from '../src/shared/catalog.ts';
import { storehouse } from '../src/storehouse/index.ts';
import { keptToSell } from '../src/storehouse/rules.ts';

const T0 = Date.UTC(2026, 10, 23, 9);
const woodcutter = (level: number, mastered: boolean): State => {
  const s = newState(9, T0);
  s.skills = { woodcutting: { xp: XP_TABLE[level] } };
  s.items = { 'carved-acorn': 5, 'birds-nest': 3 };
  if (mastered)
    for (const a of skillActions().find((x) => x.skill === 'woodcutting')!.actions)
      s.mastery[`woodcutting:${a.id}`] = 10_000_000;
  return s;
};

describe('Rare finds with no use left', () => {
  it('are sold with the finds kept to sell once every action is open and mastered', () => {
    expect(keptToSell(woodcutter(99, true), T0).sort()).toEqual(['birds-nest', 'carved-acorn']);
    const r = storehouse.routes.sellFinds.run(woodcutter(99, true), {}, T0) as unknown as {
      result: { ok: boolean; kinds: number };
    };
    expect(r.result).toMatchObject({ ok: true, kinds: 2 });
  });

  it('are kept while an action is unmastered, or not yet open', () => {
    expect(keptToSell(woodcutter(99, false), T0)).toEqual(['birds-nest']);
    expect(keptToSell(woodcutter(60, true), T0)).toEqual(['birds-nest']);
  });
});
