// The pedlar (session 217): each day three lots of what the player has or makes (an Uncommon find found, an
// older tier's material, a dish they can cook), each handed in at one press for half again its price in gold
// (never less than ten minutes of their earning) and a favour; only what they have found, gathered or cooked.
import { XP_TABLE } from '@idle-clash/content';
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import { itemOf } from '../src/shared/catalog.ts';
import { favourOf } from '../src/shared/pedlar.ts';
import { lotsOf } from '../src/pedlar/lots.ts';
import { dayOf, handIn } from '../src/pedlar/rules.ts';
import { pedlarErrands } from '../src/pedlar/view.ts';
import { FEATURES } from '../src/registry.ts';

void FEATURES;
const T0 = Date.UTC(2026, 10, 24, 9);
const DAY = 86_400_000;

function player(): State {
  const s = newState(7, T0);
  s.skills = {
    woodcutting: { xp: XP_TABLE[50] },
    mining: { xp: XP_TABLE[45] },
    cooking: { xp: XP_TABLE[40] },
  };
  s.found = { 'birds-nest': T0 - DAY, 'amber-nugget': T0 - DAY };
  // Pine and ash chopped, copper mined, perch and trout cooked.
  s.mastery = {
    'woodcutting:pine-tree': 5_000,
    'woodcutting:ash-tree': 2_000,
    'mining:copper-vein': 3_000,
    'cooking:cooked-perch': 900,
    'cooking:cooked-trout': 400,
  };
  return s;
}
/** The player holding every lot of the day twice over. */
function stocked(s: State, at = T0): State {
  const out = structuredClone(s);
  for (const l of lotsOf(s, dayOf(at))) out.items[l.item] = l.count * 2;
  return out;
}

describe('the pedlar', () => {
  it('wants nothing of a newcomer, who has found, gathered and cooked nothing', () => {
    expect(lotsOf(newState(7, T0), dayOf(T0))).toEqual([]);
    expect(pedlarErrands(newState(7, T0), T0)).toEqual([]);
  });

  it('wants an Uncommon find found, an older material and a dish the player can cook', () => {
    const lots = lotsOf(player(), dayOf(T0));
    expect(lots.map((l) => l.kind)).toEqual(['find', 'material', 'dish']);
    expect(['birds-nest', 'amber-nugget']).toContain(lots[0].item);
    expect(itemOf(lots[1].item)?.kind).toBe('resource');
    expect(itemOf(lots[2].item)?.kind).toBe('food');
    // The same lots all day; others on another day.
    expect(lotsOf(player(), dayOf(T0 + 3 * 3_600_000))).toEqual(lots);
    const week = Array.from({ length: 7 }, (_, d) =>
      lotsOf(player(), dayOf(T0 + d * DAY))
        .map((l) => l.item)
        .join(),
    );
    expect(new Set(week).size).toBeGreaterThan(1);
  });

  it('takes a lot at one press, pays at least half again its price, and a favour; once a day', () => {
    const s = stocked(player());
    const [find] = lotsOf(s, dayOf(T0));
    const r = handIn(s, 'find', T0);
    expect(r.result.ok).toBe(true);
    const gold = (r.result as { gold: number }).gold;
    expect(gold).toBeGreaterThanOrEqual(1.5 * (itemOf(find.item)?.value ?? 0) * find.count);
    expect(r.state.items[find.item]).toBe(find.count);
    expect(r.state.items.gold).toBe(gold);
    expect(favourOf(r.state)).toBe(1);
    expect(r.events[0]).toMatchObject({ type: 'pedlarPaid', favour: 1 });
    expect(handIn(r.state, 'find', T0 + 60_000).result).toEqual({ ok: false, reason: 'done' });
    // The errand names what is still wanted.
    expect(pedlarErrands(r.state, T0)[0].text).toMatch(/^The pedlar wants .+ and .+$/);
    // Tomorrow, new wants.
    const tomorrow = stocked(r.state, T0 + DAY);
    expect(handIn(tomorrow, 'find', T0 + DAY).result.ok).toBe(true);
    expect(handIn(player(), 'dish', T0).result).toEqual({ ok: false, reason: 'short' });
  });
});
