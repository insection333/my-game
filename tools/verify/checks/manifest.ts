// The manifest check: every feature declares every part, fills only slots IA.md lists, is registered,
// and keeps to its own folder. Pure: callers pass in what it checks, so tests can use fixtures.
import type { Feature, SlotContext } from '@idle-clash/features';

export interface ManifestInput {
  features: readonly Feature[];
  /** Slot ids listed in IA.md. */
  slots: string[];
  /** Folder names under packages/features/src, other than shared/. */
  folders: string[];
  /** States to fill slots from: a new player and a sample save at least. */
  states: SlotContext[];
}

/** Strings, finite numbers, booleans, null, arrays and plain objects only: what the page can receive. */
export function isPlainJson(v: unknown): boolean {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return true;
  if (typeof v === 'number') return Number.isFinite(v);
  if (Array.isArray(v)) return v.every(isPlainJson);
  if (typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v) as unknown;
  return (proto === Object.prototype || proto === null) && Object.values(v).every(isPlainJson);
}

export function checkManifest({ features, slots, folders, states }: ManifestInput): string[] {
  const problems: string[] = [];
  const ids = features.map((f) => f.id);
  for (const id of ids.filter((id, i) => ids.indexOf(id) !== i)) problems.push(`Feature "${id}" is registered twice`);
  for (const folder of folders) {
    if (!ids.includes(folder)) problems.push(`packages/features/src/${folder}/ is not in the registry (registry.ts)`);
  }
  for (const f of features) {
    const where = `Feature "${f.id}"`;
    if (!folders.includes(f.id)) problems.push(`${where} has no folder packages/features/src/${f.id}/`);
    if (!f.flag?.note) problems.push(`${where} has no flag note`);
    if (!f.help?.title || !f.help?.body) problems.push(`${where} has no Help entry`);
    if (!f.routes) problems.push(`${where} declares no routes (use {} if it has none)`);
    if (!f.rules) problems.push(`${where} declares no rules (use {} if it has none)`);
    const actions = (f.content.actions ?? []).map((a) => a.id);
    for (const a of actions) if (!f.rules?.[a]) problems.push(`${where}: action "${a}" has no rules`);
    for (const r of Object.keys(f.rules ?? {})) {
      if (!actions.includes(r)) problems.push(`${where}: rules for "${r}", which its content does not list`);
    }
    const filled = Object.keys(f.slots ?? {});
    if (!filled.length) problems.push(`${where} fills no slots, so nothing shows it`);
    for (const s of filled)
      if (!slots.includes(s)) problems.push(`${where} fills slot "${s}", which IA.md does not list`);
    if (f.content.skill) {
      for (const s of ['skills.list', 'skill.header', 'skill.actions', 'skill.ladder', 'skill.finds', 'collection.log']) {
        if (!filled.includes(s)) problems.push(`${where} is a skill but does not fill "${s}"`);
      }
    }
    for (const [slot, fill] of Object.entries(f.slots ?? {})) {
      for (const ctx of states) {
        try {
          const out: unknown = fill(ctx);
          if (!isPlainJson(out)) {
            problems.push(`${where}: slot "${slot}" gives data that is not plain JSON`);
          }
        } catch (err) {
          problems.push(`${where}: slot "${slot}" failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }
  return [...new Set(problems)];
}

/** Package dependencies ARCHITECTURE.md allows inside the workspace. */
export const ALLOWED_DEPS: Record<string, string[]> = {
  '@idle-clash/kernel': [],
  '@idle-clash/content': ['@idle-clash/kernel'],
  '@idle-clash/contracts': ['@idle-clash/kernel'],
  '@idle-clash/ui': [],
  '@idle-clash/features': ['@idle-clash/kernel', '@idle-clash/content', '@idle-clash/ui'],
  '@idle-clash/server': ['@idle-clash/kernel', '@idle-clash/content', '@idle-clash/contracts', '@idle-clash/features'],
  '@idle-clash/web': [
    '@idle-clash/kernel',
    '@idle-clash/content',
    '@idle-clash/contracts',
    '@idle-clash/ui',
    '@idle-clash/features',
  ],
  '@idle-clash/tools': ['*'],
};

/** Problems with workspace dependencies, from each package's name and declared dependencies. */
export function checkPackageDeps(packages: { name: string; deps: string[] }[]): string[] {
  const problems: string[] = [];
  for (const p of packages) {
    const allowed = ALLOWED_DEPS[p.name];
    if (!allowed) {
      problems.push(`${p.name} is not in ARCHITECTURE.md's package table`);
      continue;
    }
    for (const d of p.deps.filter((d) => d.startsWith('@idle-clash/'))) {
      if (!allowed.includes('*') && !allowed.includes(d)) problems.push(`${p.name} may not depend on ${d}`);
    }
  }
  return problems;
}

/**
 * Problems with imports inside packages/features/src: a feature never imports another feature or
 * the registry, and shared/ never imports a feature. `files` maps a path under src/ to its source.
 */
export function checkFeatureImports(files: Record<string, string>, folders: string[]): string[] {
  const problems: string[] = [];
  for (const [path, source] of Object.entries(files)) {
    const home = path.split('/')[0];
    const inFeature = folders.includes(home);
    for (const m of source.matchAll(/(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]/g)) {
      const spec = m[1];
      if (spec === '@idle-clash/features') problems.push(`${path} imports @idle-clash/features from inside it`);
      if (!spec.startsWith('.')) continue;
      const target = new URL(spec, `file:///src/${path}`).pathname.replace(/^\/src\//, '');
      const targetHome = target.split('/')[0];
      if (inFeature && folders.includes(targetHome) && targetHome !== home) {
        problems.push(`${path} imports ${targetHome}/: a feature never imports another feature`);
      }
      if (inFeature && !folders.includes(targetHome) && !['shared', 'define.ts'].includes(targetHome)) {
        problems.push(`${path} imports ${target}: features import only shared/ and define.ts`);
      }
      if (home === 'shared' && folders.includes(targetHome))
        problems.push(`${path} imports the feature ${targetHome}/`);
    }
  }
  return problems;
}
