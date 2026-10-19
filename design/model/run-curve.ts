// First pass: fit the level times, derive the table from Woodcutting, then verify every skill against it.
import { fitLevelTimes, simulate, gatherCandidates, smithingCandidates, combatCandidates, roundTable, levelFromTable } from './curve.ts';

const fit = fitLevelTimes();
console.log('fit', fit.rE.toFixed(2), fit.lm.toFixed(1), 'T2', (fit.T[2] * 3600).toFixed(0) + 's', 'T10', fit.T[10].toFixed(2), 'T20', fit.T[20].toFixed(1), 'T30', fit.T[30].toFixed(1), 'T40', fit.T[40].toFixed(1));
const d = simulate(gatherCandidates('woodcutting'), { days: 21, T: fit.T });
const table = roundTable(d.derived.slice(0, 41));
console.log('table', table.slice(1).join(','));
const show = (name: string, r: number[]) =>
  console.log(name.padEnd(12), [2, 10, 20, 30, 40].map((l) => `L${l} ${r[l] === undefined ? '—' : r[l] < 1 ? (r[l] * 60).toFixed(1) + 'm' : r[l] < 48 ? r[l].toFixed(1) + 'h' : (r[l] / 24).toFixed(1) + 'd'}`).join('  '));
show('woodcutting', simulate(gatherCandidates('woodcutting'), { days: 30, table }).reached);
show('mining', simulate(gatherCandidates('mining'), { days: 30, table }).reached);
show('smithing', simulate(smithingCandidates, { days: 30, table }).reached);
for (const style of ['melee', 'archery', 'magic'] as const) {
  let hpXp = 0;
  const r = simulate(combatCandidates(style, () => Math.max(1, levelFromTable(table, hpXp))), { days: 30, table, step: 60, onHp: (x) => (hpXp += x) });
  show(style, r.reached);
  console.log('   hitpoints at end', levelFromTable(table, hpXp));
}
