// The nine steps of pnpm verify, in the brief's order. A step that is not built yet says so and
// names its session; once the thing it checks exists, an unbuilt step fails instead of skipping.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bin, node, ROOT } from './exec.ts';
import { allStringKeys } from '@idle-clash/content';
import type { Feature } from '@idle-clash/features';
import { checkContent } from './checks/content.ts';
import { checkDesign } from './checks/design-sync.ts';
import { checkFeatureImports, checkManifest, checkPackageDeps } from './checks/manifest.ts';
import { featureFiles, featureFolders, literalStringKeys, sampleStates, workspacePackages } from './checks/sources.ts';
import { featuresMd, glossaryMd } from './features-md.ts';
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

const skillsOf = (features: readonly Feature[]) =>
  features.flatMap((f) => (f.content.skill ? [f.content.skill.id] : []));

/** Writes a generated file locally; in CI, a stale one fails instead. Returns a problem or null. */
function regenerate(path: string, text: string): string | null {
  const current = existsSync(join(ROOT, path)) ? read(path) : '';
  if (current === text) return null;
  if (process.env.CI) return `${path} is out of date: run pnpm verify locally and commit it`;
  writeFileSync(join(ROOT, path), text);
  return null;
}

/** Loads the registry, turning an error while features load (bad content) into a failure. */
async function loadFeatures(): Promise<{ features: readonly Feature[] } | { error: string }> {
  try {
    const { FEATURES } = await import('@idle-clash/features');
    return { features: FEATURES };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function manifest(): Promise<StepResult> {
  const map = readPageMap(read('IA.md'));
  if (map.problems.length) return fail('IA.md has problems', map.problems.join('\n'));
  const loaded = await loadFeatures();
  if ('error' in loaded) return fail('the features failed to load', loaded.error);
  const { features } = loaded;
  const folders = featureFolders();
  const problems = [
    ...checkManifest({ features, slots: map.slots, folders, states: sampleStates(skillsOf(features)) }),
    ...checkPackageDeps(workspacePackages()),
    ...checkFeatureImports(featureFiles(), folders),
  ];
  const stale = regenerate('FEATURES.md', featuresMd(features));
  if (stale) problems.push(stale);
  if (problems.length)
    return fail(`${problems.length} manifest problem${problems.length > 1 ? 's' : ''}`, problems.join('\n'));
  const on = features.filter((f) => f.flag.on).length;
  return pass(
    `${features.length} feature${features.length === 1 ? '' : 's'} (${on} on), all complete; IA.md: ${map.menu.length} menu entries, ${map.slots.length} slots`,
  );
}

async function content(): Promise<StepResult> {
  const docs = await node('design/model/build-docs.ts', ['--check']);
  if (docs.code !== 0) return fail('GAME_DESIGN.md is out of date', docs.output);
  const loaded = await loadFeatures();
  if ('error' in loaded) return fail('the features failed to load', loaded.error);
  const { features } = loaded;
  const literalKeys = literalStringKeys(allStringKeys());
  const { problems, strings } = checkContent({ features, states: sampleStates(skillsOf(features)), literalKeys });
  problems.push(...checkDesign(features, JSON.parse(read('design/model/xp-table.json')) as number[]));
  const stale = regenerate('GLOSSARY.md', glossaryMd());
  if (stale) problems.push(stale);
  if (problems.length)
    return fail(`${problems.length} content problem${problems.length > 1 ? 's' : ''}`, problems.join('\n'));
  const levels = features.filter((f) => f.content.skill).length * 40;
  return pass(`${levels} levels all unlock something; ${strings} strings, all used; content matches GAME_DESIGN.md`);
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
