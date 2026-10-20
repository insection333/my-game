// pnpm verify: decides whether a change is done. `pnpm verify --only 1,4` runs chosen steps.
import { runSteps } from './run.ts';
import { STEPS } from './steps.ts';
import { closeSession } from './web/session.ts';

const arg = process.argv.indexOf('--only');
const only = arg > 0 ? (process.argv[arg + 1] ?? '').split(',').map(Number).filter(Boolean) : undefined;
process.exitCode = await runSteps(STEPS, {
  only,
  print: (line) => console.log(line),
  annotate: process.env.GITHUB_ACTIONS === 'true',
});
await closeSession();
