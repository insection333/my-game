// Castle Clash on the pure engine, run alone: node tools/sim/castle-run.ts
import { castleChecks } from './castle/checks.ts';

const started = Date.now();
const lines: string[] = [];
const failed: string[] = [];
let passed = 0;
castleChecks((ok, what) => {
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${what}`);
  if (ok) passed++;
  else failed.push(what);
}, lines);
console.log(lines.join('\n'));
console.log(`\n${passed} passed, ${failed.length} failed in ${((Date.now() - started) / 1000).toFixed(1)} s`);
process.exitCode = failed.length ? 1 : 0;
