// A spy's report says what got through (session 169): an agent who poisoned a stronghold's wells read
// "Done unseen", and its account "Nothing changed hands", with no word of what it left on them.
import { describe, expect, it } from 'vitest';
import { readReport } from '../src/pages/castle/Reports.tsx';
import { cardOf } from '../src/pages/castle/report-model.ts';

const report = (data: Record<string, unknown>) =>
  ({ id: 1, at: 0, kind: 'spyOut', data, foeName: null }) as Parameters<typeof readReport>[0];

describe("a spy's report", () => {
  it('names the stronghold and says what the mission left on it', () => {
    const r = readReport(
      report({ foe: 'merc:2026-11-22:1', merc: { first: 0, second: 0 }, mission: 'poison', success: true }),
    );
    expect(r.facts).toContain('Their troops −8% for 4 hours (twice at most)');
    expect(r.line).not.toMatch(/departed/i);
  });

  it("says a sabotaged gatehouse's trap fails for its time at a foe, and for the next siege at a lord", () => {
    expect(readReport(report({ fortress: 'thornwall-keep', mission: 'sabotage', success: true })).facts).toContain(
      'Their trap fails for 2 hours',
    );
    expect(readReport(report({ foe: 'x', mission: 'sabotage', success: true })).facts).toContain(
      'Their trap fails in the next fair siege within 2 hours',
    );
  });

  it("names a legend's chamber as itself, its gatehouse failing for its time (session 225)", () => {
    const r = readReport(
      report({ foe: 'legend:1:2', legend: 'the-drowned-throne', chamber: 2, mission: 'sabotage', success: true }),
    );
    expect(r.line).toContain('The Drowned Throne: chamber\u00a03');
    expect(r.line).not.toMatch(/departed/i);
    expect(r.facts).toContain('Their trap fails for 2 hours');
    const card = cardOf(
      {
        id: 1,
        at: 0,
        kind: 'spyOut',
        data: { legend: 'the-drowned-throne', chamber: 2, mission: 'poison', success: true },
        foeName: null,
      },
      'me',
    )!;
    expect(card.right.name).toBe('The Drowned Throne: chamber\u00a03');
    // And a chamber's battle files with the strongholds and fortresses, where it stood under All alone.
    const battle = {
      id: 2,
      at: 0,
      kind: 'legend',
      data: { legend: 'the-drowned-throne', chamber: 2, won: true },
      foeName: null,
    };
    expect(cardOf(battle, 'me')!.filter).toBe('strongholds');
  });

  it('says nothing more of an agent caught', () => {
    expect(readReport(report({ fortress: 'thornwall-keep', mission: 'poison', success: false })).facts).toHaveLength(1);
  });
});
