// The nine steps of pnpm verify, in the brief's order. A step that is not built yet says so and
// names its session; once the thing it checks exists, an unbuilt step fails instead of skipping.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bin, node, ROOT } from './exec.ts';
import { featuresMd } from './features-md.ts';
import { readPageMap } from './ia.ts';
import type { Step, StepResult } from './run.ts';

const pass = (summary: string): StepResult => ({ status: 'pass', summary });
const fail = (summary: string, detail?: string): StepResult => ({ status: 'fail', summary, detail });
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const dirs = (path: string) =>
  existsSync(join(ROOT, path))
    ? readdirSync(join(ROOT, path)).filter((d) => statSync(join(ROOT, path, d)).isDirectory())
    : [];

/** Every TypeScript project in the workspace: the root, design/, tools/ and each package and app. */
export function projects(): string[] {
  const listed = ['.', 'design', 'tools', ...['packages', 'apps'].flatMap((g) => dirs(g).map((d) => `${g}/${d}`))];
  return listed.filter((p) => existsSync(join(ROOT, p, 'tsconfig.json')));
}

async function typecheckAndLint(): Promise<StepResult> {
  const list = projects();
  const checked = await Promise.all(list.map((p) => bin('tsc', ['-p', p]).then((r) => ({ p, ...r }))));
  const broken = checked.filter((r) => r.code !== 0);
  if (broken.length)
    return fail(`typecheck failed in ${broken.map((b) => b.p).join(', ')}`, broken.map((b) => b.output).join('\n'));
  const lint = await bin('eslint', ['.', '--max-warnings', '0']);
  if (lint.code !== 0) return fail('lint found problems', lint.output);
  const format = await bin('prettier', ['--check', '.', '--log-level', 'warn']);
  if (format.code !== 0) return fail('formatting differs: run pnpm format', format.output);
  return pass(`${list.length} projects typechecked; lint and formatting clean`);
}

function manifest(): StepResult {
  const map = readPageMap(read('IA.md'));
  if (map.problems.length) return fail('IA.md has problems', map.problems.join('\n'));
  const features = dirs('packages/features/src');
  if (features.length)
    return fail(`feature folders exist (${features.join(', ')}) but the manifest check arrives in session 3`);
  const md = featuresMd(features);
  const current = existsSync(join(ROOT, 'FEATURES.md')) ? read('FEATURES.md') : '';
  if (current !== md) {
    if (process.env.CI) return fail('FEATURES.md is out of date: run pnpm verify locally and commit it');
    writeFileSync(join(ROOT, 'FEATURES.md'), md);
  }
  return pass(
    `no features yet; IA.md: ${map.menu.length} menu entries, ${map.pages.length} pages, ${map.slots.length} slots`,
  );
}

async function content(): Promise<StepResult> {
  const docs = await node('design/model/build-docs.ts', ['--check']);
  if (docs.code !== 0) return fail('GAME_DESIGN.md is out of date', docs.output);
  if (!existsSync(join(ROOT, 'GLOSSARY.md'))) return fail('GLOSSARY.md is missing');
  return pass('GAME_DESIGN.md matches the model; content schemas arrive in session 3');
}

async function tests(): Promise<StepResult> {
  const r = await bin('vitest', ['run']);
  const passed = /Tests\s+(\d+) passed/.exec(r.output)?.[1];
  if (r.code !== 0 || !passed) return fail('tests failed', r.output);
  return pass(`${passed} tests`);
}

async function simulation(): Promise<StepResult> {
  const reportPath = 'design/model/report.md';
  const before = read(reportPath);
  const r = await node('design/model/checks2.ts');
  const checks = (r.output.match(/^PASS /gm) ?? []).length;
  if (r.code !== 0)
    return fail(
      'the paper model misses a target',
      r.output
        .split('\n')
        .filter((l) => /^FAIL /.test(l))
        .join('\n'),
    );
  if (read(reportPath) !== before) return fail("the model's report changed: run pnpm design:build and commit");
  return pass(`paper model: ${checks} target checks (the real simulation replaces it in session 6)`);
}

/** A step not built yet: skips while there are no pages, fails once pages exist without it. */
const later = (session: number) => (): StepResult =>
  existsSync(join(ROOT, 'apps/web/src/pages'))
    ? fail(`pages exist but this step is not built (due in session ${session})`)
    : { status: 'skip', summary: `no pages yet (session ${session})` };

export const STEPS: Step[] = [
  { n: 1, name: 'Typecheck and lint', run: typecheckAndLint },
  { n: 2, name: 'Manifest', run: manifest },
  { n: 3, name: 'Content', run: content },
  { n: 4, name: 'Tests', run: tests },
  { n: 5, name: 'Simulation', run: simulation },
  { n: 6, name: 'Screenshots', run: later(4) },
  { n: 7, name: 'Accessibility', run: later(4) },
  { n: 8, name: 'Performance budgets', run: later(4) },
  { n: 9, name: 'Review sheets', run: later(4) },
];
