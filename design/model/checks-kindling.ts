// Step 17's proof, on paper: a Kindling takes about a quarter of the first climb's time at the top's
// pace (the brief's "a second climb in a quarter of the first", with nothing taken away), and the
// Paths change only what a skill pays past 99, so the climb to 99 keeps its pace.
import { gatherCandidates, simulate, smithingCandidates, type Candidates } from './curve.ts';
import { KINDLE_XP, PATHS, pathPct } from './kindling.ts';

type Say = (s?: string) => void;
type Ok = (b: boolean, what: string) => void;

export function kindlingChecks(out: Say, ok: Ok, table: number[]) {
  out('\n## Kindling (step 17)');
  const runs: [string, Candidates][] = [
    ['Woodcutting', gatherCandidates('woodcutting')],
    ['Smithing', smithingCandidates],
  ];
  for (const [name, c] of runs) {
    const days99 = simulate(c, { days: 125, table }).reached[99] / 24;
    const after = simulate(c, { days: days99 * 1.25, table }).xp - table[99];
    const share = KINDLE_XP / after;
    out(
      `${name}: 99 on day ${days99.toFixed(1)}; a quarter of that again earns ${Math.round(after).toLocaleString('en')} XP; a Kindling is ${KINDLE_XP.toLocaleString('en')} (${Math.round(share * 100)}% of it)`,
    );
    ok(
      share >= 0.75 && share <= 1.25,
      `${name}: a Kindling takes about a quarter of the first climb's time (within 25%)`,
    );
  }
  out(
    `Paths at 99, then at five Kindlings: ${PATHS.map((p) => `${p.id} +${pathPct(p, 0)}% to +${pathPct(p, 5)}% ${p.raises}`).join('; ')}`,
  );
  ok(
    PATHS.every((p) => pathPct(p, 99) === pathPct(p, 5)),
    'A Path strengthens with the first five Kindlings only',
  );
}
