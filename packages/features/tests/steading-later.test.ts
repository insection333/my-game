// Session 244: the steading's later stages. A work rose five times and stopped, and the twenty Uncommon
// finds had no use but the vendor; from its sixth stage a work takes the Uncommon finds of the skills it
// serves (their greater finds at the tenth), each later stage giving half what an earlier one did, and Sell
// finds keeps back what the next stages ask.
import { newState, type State } from '@idle-clash/kernel';
import { describe, expect, it } from 'vitest';
import '../src/index.ts';
import { storehouse } from '../src/storehouse/index.ts';
import { findsToSell } from '../src/storehouse/rules.ts';
import {
  GREATER,
  PENNANT,
  STAGES,
  stageCost,
  steadingKeeps,
  steadingXpPct,
  workById,
  workPct,
} from '../src/shared/steading.ts';
import { raise } from '../src/steading/rules.ts';
import { steadingView } from '../src/steading/view.ts';
import { deedById } from '../src/deeds/list.ts';
import { Reader } from '../src/deeds/reader.ts';

const T0 = Date.UTC(2026, 10, 26, 9);
const woodyard = workById('woodyard')!;
const at = (stages: Record<string, number>, items: Record<string, number> = {}): State => ({
  ...newState(5, T0),
  items,
  features: { steading: { stages } },
});

describe('the later stages', () => {
  it('take the finds of the skills a work serves from the sixth, and their greater finds at the tenth', () => {
    expect(STAGES).toBe(10);
    for (let n = 1; n <= PENNANT; n++)
      expect(stageCost(woodyard, n).items.map((i) => i.item)).not.toContain('birds-nest');
    expect(stageCost(woodyard, 6).items).toEqual([
      { item: 'ancient-logs', count: 4_000 },
      { item: 'birds-nest', count: 60 },
      { item: 'rough-garnet', count: 60 },
    ]);
    expect(stageCost(woodyard, 10).items.map((i) => i.item)).toEqual([
      'ancient-logs',
      'birds-nest',
      'rough-garnet',
      GREATER['birds-nest'],
      GREATER['rough-garnet'],
    ]);
  });

  it('give half what an earlier stage gave', () => {
    const shrine = workById('shrine')!;
    expect(workPct(shrine, 5)).toBe(5);
    expect(workPct(shrine, 10)).toBe(7.5);
    expect(steadingXpPct(at({ shrine: 10 }))).toBe(7.5);
  });

  it('are raised with the finds, and refused short of one', () => {
    const cost = stageCost(woodyard, 6);
    const held: Record<string, number> = Object.fromEntries([
      ['gold', cost.gold],
      ...cost.items.map((i): [string, number] => [i.item, i.count]),
    ]);
    const r = raise(at({ woodyard: 5 }, held), 'woodyard', T0);
    expect(r.result).toEqual({ ok: true, stage: 6 });
    expect(r.state.items['birds-nest'] ?? 0).toBe(0);
    const short = raise(at({ woodyard: 5 }, { ...held, 'rough-garnet': 59 }), 'woodyard', T0);
    expect(short.result).toEqual({ ok: false, reason: 'short', item: 'rough-garnet' });
    const row = steadingView(r.state).rows.find((w) => w.id === 'woodyard')!;
    expect(row.standing).toBe('Raised 6 of 10');
    expect(row.next?.gives).toBe('+12% chance of an extra item when gathering');
  });
});

describe('Sell finds', () => {
  it('keeps back what the next stages ask, counted for every work that takes a find', () => {
    // Session 259: the logs the next stage takes as well were named among the finds kept back.
    const items = { 'birds-nest': 500, 'rough-garnet': 40, 'chalk-stub': 30, 'ancient-logs': 9_000 };
    // Below its pennant a work asks for no finds.
    expect(steadingKeeps(at({ woodyard: 4 }), 'birds-nest')).toBe(0);
    const s = at({ woodyard: 5, watchtower: 6 }, items);
    expect(steadingKeeps(s, 'birds-nest')).toBe(60 + 90);
    expect(findsToSell(s, T0)).toEqual([
      { item: 'birds-nest', count: 350 },
      { item: 'chalk-stub', count: 30 },
    ]);
    const view = storehouse.slots['store.capacity']({ state: s, now: T0 }) as { sellFinds: { ask: string } };
    expect(view.sellFinds.ask).toMatch(
      /What your steading asks of bird's nest and rough garnet is kept back for it\.$/,
    );
  });
});

describe('the deeds', () => {
  it('mark the pennant at five and the height at ten', () => {
    const reader = (stage: number) => new Reader(at({ woodyard: stage }), T0);
    const pennant = deedById('raised-woodyard')!;
    const height = deedById('height-woodyard')!;
    expect([pennant.target, height.target]).toEqual([5, 10]);
    expect(pennant.measure(reader(5))).toBe(5);
    expect(height.measure(reader(10))).toBe(10);
    expect(deedById('steading-height')!.target).toBe(6);
  });
});
