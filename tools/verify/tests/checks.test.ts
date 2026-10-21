import { allStringKeys, buildLadder } from '@idle-clash/content';
import { defineFeature, FEATURES, type Feature } from '@idle-clash/features';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkContent } from '../checks/content.ts';
import { checkFeatureImports, checkManifest, checkPackageDeps } from '../checks/manifest.ts';
import { literalStringKeys, sampleStates } from '../checks/sources.ts';
import { ROOT } from '../exec.ts';
import { readPageMap } from '../ia.ts';

const states = sampleStates(
  FEATURES.flatMap((f) => (f.content.skill ? [f.content.skill.id] : [])),
  FEATURES,
);
const [woodcutting] = FEATURES;
// The slots IA.md lists, as verify reads them.
const slots = readPageMap(readFileSync(join(ROOT, 'IA.md'), 'utf8')).slots;
const manifest = (features: Feature[], folders = features.map((f) => f.id)) =>
  checkManifest({ features, slots, folders, states });
const literalKeys = literalStringKeys(allStringKeys());
const content = (features: Feature[], keys = literalKeys) =>
  checkContent({ features, states, literalKeys: keys }).problems;

describe('the manifest check', () => {
  it('passes the real registry', () => {
    expect(manifest([...FEATURES])).toEqual([]);
  });

  it('finds a folder missing from the registry, and a slot IA.md does not list', () => {
    const odd = { ...woodcutting, slots: { ...woodcutting.slots, 'hearth.weather': () => null } };
    expect(manifest([odd], ['woodcutting', 'fishing'])).toEqual([
      'packages/features/src/fishing/ is not in the registry (registry.ts)',
      'Feature "woodcutting" fills slot "hearth.weather", which IA.md does not list',
    ]);
  });

  it('finds an action without rules and a skill without its page slots', () => {
    const { 'pine-tree': _gone, ...rules } = woodcutting.rules;
    const { 'skill.actions': _slot, ...rest } = woodcutting.slots;
    expect(manifest([{ ...woodcutting, rules, slots: rest }])).toEqual([
      'Feature "woodcutting": action "pine-tree" has no rules',
      'Feature "woodcutting" is a skill but does not fill "skill.actions"',
    ]);
  });

  it('finds a slot that throws or gives data that is not plain JSON', () => {
    const broken = {
      ...woodcutting,
      slots: {
        ...woodcutting.slots,
        'skills.list': () => {
          throw new Error('boom');
        },
        'hearth.nextUp': () => ({ at: new Date(0) }) as never,
      },
    };
    expect(manifest([broken])).toEqual([
      'Feature "woodcutting": slot "skills.list" failed: boom',
      'Feature "woodcutting": slot "hearth.nextUp" gives data that is not plain JSON',
    ]);
  });

  it('keeps features out of each other and packages to their allowed dependencies', () => {
    const files = {
      'mining/rules.ts': "import { TREES } from '../woodcutting/content.ts';\nimport { x } from '../shared/skill.ts';",
      'shared/skill.ts': "import { y } from '../mining/content.ts';",
      'woodcutting/index.ts': "import { FEATURES } from '../registry.ts';",
    };
    expect(checkFeatureImports(files, ['mining', 'woodcutting'])).toEqual([
      'mining/rules.ts imports woodcutting/: a feature never imports another feature',
      'shared/skill.ts imports the feature mining/',
      'woodcutting/index.ts imports registry.ts: features import only shared/ and define.ts',
    ]);
    expect(checkPackageDeps([{ name: '@idle-clash/kernel', deps: ['@idle-clash/content', 'zod'] }])).toEqual([
      '@idle-clash/kernel may not depend on @idle-clash/content',
    ]);
  });
});

describe('the content check', () => {
  it('passes the real registry', () => {
    expect(content([...FEATURES])).toEqual([]);
  });

  const tiny = (over: Partial<Feature> = {}) =>
    defineFeature({
      ...woodcutting,
      id: 'woodcutting',
      content: {
        items: woodcutting.content.items,
        actions: [{ id: 'pine-tree', level: 1, gives: [{ item: 'pine-logs', count: 1 }] }],
        skill: { id: 'woodcutting', ladder: buildLadder([{ id: 'pine-tree', level: 1 }], []) },
        finds: woodcutting.content.finds,
      },
      effects: [],
      ...over,
    });

  it('finds a skill without its lesser and greater find at each rarity', () => {
    const finds = (woodcutting.content.finds ?? []).filter((f) => f.item !== 'heartwood-knot');
    const problems = content([tiny({ content: { ...tiny().content, finds } })]);
    expect(problems).toContain('Feature "woodcutting": needs a lesser then a greater rare find (it has 1)');
  });

  it('finds every empty level', () => {
    const problems = content([tiny()]);
    expect(problems[0]).toBe(
      `Feature "woodcutting": levels with nothing to unlock: ${Array.from({ length: 39 }, (_, i) => i + 2).join(', ')}`,
    );
  });

  it('finds a missing string, an undeclared effect and an output no feature defines', () => {
    const f = tiny({
      content: {
        items: [],
        actions: [{ id: 'birch', level: 1, gives: [{ item: 'birch-logs', count: 1 }] }],
        skill: {
          id: 'woodcutting',
          ladder: buildLadder(
            [{ id: 'birch', level: 1 }],
            [{ perk: 'plenty', effect: { kind: 'extraYield', pct: 3 }, levels: [2] }],
          ),
        },
      },
      rules: {},
      slots: {},
    });
    const problems = content([f]);
    expect(problems).toContain('Feature "woodcutting": action "birch": Missing string "action.woodcutting.birch"');
    expect(problems).toContain('Feature "woodcutting" uses effect "extraYield" but does not declare it');
    expect(problems).toContain('Feature "woodcutting": action "birch" gives "birch-logs", which no feature defines');
  });

  it('finds strings nothing uses', () => {
    const problems = content([], new Set());
    expect(problems.at(-1)).toMatch(/^Strings nothing uses \(remove them, or use them\): .*item\.pine-logs/);
  });
});

describe('defineFeature', () => {
  it('refuses content that breaks the shared schemas', () => {
    expect(() =>
      defineFeature({ ...woodcutting, content: { items: [{ id: 'Bad Id', kind: 'resource', value: 1 }] } }),
    ).toThrow('Feature "woodcutting" has invalid content');
  });
});
