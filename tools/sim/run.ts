// Runs the simulation and prints its report: node tools/sim/run.ts
import { runSimulation } from './checks.ts';

const started = Date.now();
const r = runSimulation();
console.log(r.lines.join('\n'));
console.log(`\n${r.passed} passed, ${r.failed.length} failed in ${((Date.now() - started) / 1000).toFixed(1)} s`);
process.exitCode = r.failed.length ? 1 : 0;
