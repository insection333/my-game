// The pedlar's lot kept back (session 226): the pedlar wants three of a found Uncommon find each day and an
// older material, yet Sell finds sold every Uncommon find and the realm's Give all gave the whole of a
// material, so one press elsewhere took away the very lot the Hearth asked for that morning. Both now keep
// the day's lot back until it is handed in, and say so; the sell panel says the pedlar wants them.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { handIn } from '../src/pedlar/rules.ts';
import { dayOf } from '../src/shared/pedlar.ts';
import { lotsOf, pedlarWants } from '../src/shared/pedlar-lots.ts';
import { realmWorkIn } from '../src/shared/realm-work.ts';
import { give } from '../src/steading/realm-give.ts';
import { realmWorkView } from '../src/steading/realm-view.ts';
import { storehouse } from '../src/storehouse/index.ts';
import { sellFinds } from '../src/storehouse/rules.ts';

const T0 = Date.UTC(2026, 10, 24, 9);

function player(): State {
  const s = newState(7, T0);
  s.skills = { woodcutting: { xp: XP_TABLE[50] } };
  s.found = { 'birds-nest': T0 - 86_400_000 };
  s.mastery = { 'woodcutting:pine-tree': 5_000 };
  // Rough garnets, not amber nuggets, which a feast takes (session 245) and Sell finds keeps.
  s.items = { 'birds-nest': 90, 'rough-garnet': 2, 'pine-logs': 1_000 };
  return s;
}

describe("the pedlar's lot kept back", () => {
  it('is the found find and the old material', () => {
    expect(lotsOf(player(), dayOf(T0)).map((l) => [l.kind, l.item])).toEqual([
      ['find', 'birds-nest'],
      ['material', 'pine-logs'],
    ]);
  });

  it('keeps three of the day’s find from Sell finds until it is handed in, and says so', () => {
    const r = sellFinds(player(), T0);
    expect(r.result).toEqual({ ok: true, gold: 87 * 100 + 2 * 100, kinds: 2 });
    expect(r.state.items['birds-nest']).toBe(3);
    const view = storehouse.slots['store.capacity']({ state: player(), now: T0 }) as unknown as {
      sellFinds: { ask: string };
    };
    const ask = view.sellFinds.ask;
    expect(ask).toContain("Bird's nest ×3: kept back for the pedlar today.");
    // Handed in, the rest of the day's nests go with the others.
    const handed = handIn(player(), 'find', T0).state;
    expect(sellFinds(handed, T0).state.items['birds-nest'] ?? 0).toBe(0);
  });

  it('keeps the day’s material from Give all, and the realm’s work says so', () => {
    const lot = lotsOf(player(), dayOf(T0)).find((l) => l.kind === 'material')!;
    const r = give(player(), { item: 'pine-logs' }, T0);
    expect(r.result.ok).toBe(true);
    expect(r.state.items['pine-logs']).toBe(lot.count);
    const s = player();
    const work = realmWorkIn(1);
    s.features['realm-work'] = {
      season: 1,
      work,
      needed: 40_000_000,
      given: 0,
      mine: 0,
      givers: 0,
      finished: 0,
      thanks: null,
    };
    const row = realmWorkView(s, T0)?.materials.find((m) => m.item === 'pine-logs');
    expect(row?.label).toContain(`×${1_000 - lot.count}`);
    expect(row?.kept).toBe(`${lot.count} kept back for the pedlar today`);
  });

  it('is said on the item’s sell panel', () => {
    expect(pedlarWants(player(), T0, 'birds-nest')).toBe('The pedlar wants 3 of these today.');
    expect(pedlarWants(handIn(player(), 'find', T0).state, T0, 'birds-nest')).toBeNull();
    expect(pedlarWants(player(), T0, 'rough-garnet')).toBeNull();
  });
});

describe("the steading's next stage, said before giving", () => {
  it('names the work whose next stage takes a material', () => {
    const s = player();
    s.features['realm-work'] = {
      season: 1,
      work: realmWorkIn(1),
      needed: 40_000_000,
      given: 0,
      mine: 0,
      givers: 0,
      finished: 0,
      thanks: null,
    };
    const row = () => realmWorkView(s, T0)?.materials.find((m) => m.item === 'pine-logs');
    expect(row()?.steading).toBe("Your Woodyard's next stage takes 200 of these.");
    s.features.steading = { stages: { woodyard: 5, 'training-yard': 5, smokehouse: 5, watchtower: 5 } };
    expect(row()?.steading).toBeNull();
  });
});
