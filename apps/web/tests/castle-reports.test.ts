// Battle reports as cards (session 42): each kind of report reads the right way round (the attacker on
// the left), says whether it went your way, files under its filter and carries what it moved; the Reports
// tab lists a filter's reports newest first.
import { describe, expect, it } from 'vitest';
import { cardOf, cardsBy } from '../src/pages/castle/report-model.ts';

const ME = 'me';
const at = Date.UTC(2026, 10, 4, 9);
const report = (id: number, kind: string, data: Record<string, unknown>, foeName: string | null = 'Keeper') => ({
  id,
  at: at + id,
  kind,
  data,
  foeName,
});

describe('a report as its card', () => {
  it('puts you on the left of your own siege, and the besieger on the left of theirs', () => {
    const out = cardOf(
      report(1, 'siegeOut', { foe: 'k', outcome: 'decisive', gold: 1200, marks: 14, attack: 9, defense: 7 }),
      ME,
    )!;
    expect([out.left.seed, out.right.seed, out.good, out.filter]).toEqual([ME, 'k', true, 'sieges']);
    expect(out.spoils.map((s) => s.icon)).toEqual(['gold', 'marks']);
    expect([out.attack, out.defense]).toEqual([9, 7]);
    const held = cardOf(report(2, 'siegeIn', { foe: 'k', outcome: 'repelled', marks: 4 }), ME)!;
    expect([held.left.seed, held.right.seed, held.good, held.filter, held.word]).toEqual([
      'k',
      ME,
      true,
      'defences',
      'Held',
    ]);
    const raided = cardOf(report(3, 'siegeIn', { foe: 'k', outcome: 'graze', raided: 5000 }), ME)!;
    expect(raided.good).toBe(false);
    expect(raided.spoils[0].icon).toBe('lost');
  });

  it('files strongholds and fortresses together, and spies apart, with the mission drawn', () => {
    const merc = cardOf(
      report(4, 'mercenary', { merc: { id: 'merc:1:0', first: 0, second: 1 }, outcome: 'repelled' }),
      ME,
    )!;
    expect([merc.filter, merc.good, merc.right.seed]).toEqual(['strongholds', false, 'merc:1:0']);
    const fort = cardOf(
      report(5, 'incursion', { fortress: 'ashen-redoubt', tier: 3, won: true, spoils: 'armoury' }),
      ME,
    )!;
    expect([fort.filter, fort.good, fort.right.seed]).toEqual(['strongholds', true, 'ashen-redoubt']);
    expect(fort.spoils[0].text[0]).toBe(fort.spoils[0].text[0].toUpperCase());
    const spy = cardOf(report(6, 'spyOut', { foe: 'k', mission: 'poison', success: false }), ME)!;
    expect([spy.filter, spy.kind, spy.mission, spy.good]).toEqual(['spies', 'spy', 'poison', false]);
    const caught = cardOf(report(7, 'spyIn', { foe: 'k' }), ME)!;
    expect([caught.filter, caught.left.seed, caught.good]).toEqual(['spies', 'k', true]);
  });

  it('draws a departed lord from their report, and leaves out a kind it cannot read', () => {
    const gone = cardOf(report(8, 'siegeOut', { outcome: 'graze' }, null), ME)!;
    expect(gone.right.seed).toBe('report-8');
    expect(gone.attack).toBeNull();
    expect(cardOf(report(9, 'somethingNew', {}), ME)).toBeNull();
  });
});

describe('the Reports tab', () => {
  it("lists a filter's reports, newest first", () => {
    const cards = [
      cardOf(report(1, 'siegeOut', { foe: 'k', outcome: 'graze' }), ME)!,
      cardOf(report(2, 'spyOut', { foe: 'k', mission: 'scout', success: true }), ME)!,
      cardOf(report(3, 'siegeOut', { foe: 'k', outcome: 'repelled' }), ME)!,
    ];
    expect(cardsBy(cards, 'all').map((c) => c.id)).toEqual([3, 2, 1]);
    expect(cardsBy(cards, 'sieges').map((c) => c.id)).toEqual([3, 1]);
    expect(cardsBy(cards, 'defences')).toEqual([]);
  });
});
