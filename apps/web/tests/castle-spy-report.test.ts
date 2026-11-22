// A spy's report says what got through (session 169): an agent who poisoned a stronghold's wells read
// "Done unseen", and its account "Nothing changed hands", with no word of what it left on them.
import { describe, expect, it } from 'vitest';
import { readReport } from '../src/pages/castle/Reports.tsx';

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

  it('says nothing more of an agent caught', () => {
    expect(readReport(report({ fortress: 'thornwall-keep', mission: 'poison', success: false })).facts).toHaveLength(1);
  });
});
