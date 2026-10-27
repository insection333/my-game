// Reading the workspace for the checks: feature folders and their files, package dependencies,
// sample states to fill slots from, and string keys that appear literally in source code.
import { MAX_LEVEL, XP_TABLE } from '@idle-clash/content';
import { LANE_IDS, laneKind, load, newState, type State } from '@idle-clash/kernel';
import type { Feature, SlotContext } from '@idle-clash/features';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from '../exec.ts';

const FEATURES_SRC = join(ROOT, 'packages/features/src');

export const featureFolders = (): string[] =>
  readdirSync(FEATURES_SRC).filter((d) => d !== 'shared' && statSync(join(FEATURES_SRC, d)).isDirectory());

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** Every source file under packages/features/src, by path relative to it. */
export const featureFiles = (): Record<string, string> =>
  Object.fromEntries(walk(FEATURES_SRC).map((p) => [relative(FEATURES_SRC, p), readFileSync(p, 'utf8')]));

/** Each workspace package's name and its dependencies. */
export function workspacePackages(): { name: string; deps: string[] }[] {
  const dirs = ['packages', 'apps']
    .flatMap((g) => readdirSync(join(ROOT, g)).map((d) => join(ROOT, g, d)))
    .concat(join(ROOT, 'tools'));
  return dirs
    .filter((d) => existsSync(join(d, 'package.json')))
    .map((d) => {
      const pkg = JSON.parse(readFileSync(join(d, 'package.json'), 'utf8')) as {
        name: string;
        dependencies?: object;
        devDependencies?: object;
      };
      return {
        name: pkg.name,
        deps: [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})],
      };
    });
}

/** A new player, every sample save (upgraded), and a player at the top of every skill: slots must fill from all. */
/**
 * States to fill slots from: a newcomer, every saved version, a player at the top of every skill, and
 * that player holding ten of every item as each feature's routes run their examples in turn (wearing a
 * sword, then taking it off), so slots are seen in the states those routes make.
 */
export function sampleStates(skills: string[] = [], features: readonly Feature[] = []): SlotContext[] {
  const now = Date.UTC(2026, 9, 20, 12);
  const maxed = newState(2, now);
  for (const s of skills) maxed.skills[s] = { xp: XP_TABLE[MAX_LEVEL] };
  const dir = join(ROOT, 'packages/kernel/tests/saves');
  const samples = readdirSync(dir)
    .filter((f) => /^v\d+\.json$/.test(f))
    .map((f) => {
      const raw = JSON.parse(readFileSync(join(dir, f), 'utf8')) as { state: { clock: number } };
      return load(raw, raw.state.clock).doc.state;
    });
  // A player with plenty of everything, then the same player with every lane at work: each runs every
  // route, so slots and routes show their fullest.
  const idle: State = {
    ...maxed,
    items: Object.fromEntries(features.flatMap((f) => (f.content.items ?? []).map((i) => [i.id, 10_000]))),
  };
  const rules = features.flatMap((f) =>
    Object.entries(f.rules).map(([id, r]) => ({ feature: f.id, id, kind: r.lane })),
  );
  const busy: State = {
    ...idle,
    lanes: Object.fromEntries(
      LANE_IDS.map((lane) => {
        const a = rules.find((r) => r.kind === laneKind(lane));
        const current = a ? { action: { feature: a.feature, id: a.id }, startedAt: now, endsAt: now + 5000 } : null;
        return [lane, { ...idle.lanes[lane], current }];
      }),
    ) as State['lanes'],
  };
  const routed: SlotContext[] = [];
  for (let played of [idle, busy])
    for (const route of features.flatMap((f) => Object.values(f.routes))) {
      played = route.run(played, route.example, now).state;
      routed.push({ state: played, now });
    }
  return [
    { state: newState(1, now), now },
    ...samples.map((state) => ({ state, now: state.clock })),
    { state: maxed, now },
    ...routed,
  ];
}

/** Quoted strings in the source of every package and app that are string keys. */
export function literalStringKeys(keys: string[]): Set<string> {
  const wanted = new Set(keys);
  const found = new Set<string>();
  const files = ['packages', 'apps'].flatMap((g) =>
    readdirSync(join(ROOT, g)).flatMap((d) => walk(join(ROOT, g, d, 'src'))),
  );
  for (const file of files) {
    if (file.includes(join('strings', ''))) continue;
    for (const m of readFileSync(file, 'utf8').matchAll(/['"`]([a-z][\w.-]*\.[\w.-]+)['"`]/g))
      if (wanted.has(m[1])) found.add(m[1]);
  }
  return found;
}
