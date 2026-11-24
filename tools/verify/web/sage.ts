// A fifth player for the screenshots (session 224): two years in, as the year's simulation has its steady
// player at day 730. Every skill at 99 and kindled past it (six Kindlings each, the seal's ornament; eight in
// Woodcutting, the Kindled frame), a Path on every skill, dawnsteel worn and tempered to its last step, the
// Deep's relics raised and its deepest near 140, the pedlar's favour past Friend of the Road, and a castle
// two years old in the middle of the season's legend (castles.ts), its Call to arms answered today so the
// Hearth leads with the chamber standing open. The pages of year two were checked only as a year-in
// player saw them, where nothing of the second year had begun.
import { XP_TABLE } from '@idle-clash/content';
import { allSkills, FEATURES, findOf, items, kindlingData } from '@idle-clash/features';
import { seeded, type Command, type State } from '@idle-clash/kernel';
import type { Ctx } from '../../../apps/server/src/context.ts';
import { keeper } from './elder.ts';
import { withDeep } from './deep-week.ts';

const { KINDLE_XP } = kindlingData;
const STYLES = ['melee', 'archery', 'magic'];
const DAWN = [
  'dawnsteel-sword',
  'dawnsteel-bow',
  'dawnsteel-staff',
  'dawnsteel-helm',
  'dawnsteel-body',
  'dawnsteel-legs',
];

/** Two years of work on the last tier's actions: mastery well along, the best at full. */
const MASTERY: Record<string, number> = {
  'woodcutting:ancient-tree': 28_800,
  'woodcutting:old-ancient': 14_200,
  'mining:dawnstone-vein': 21_400,
  'fishing:dawn-sturgeon-shallows': 16_900,
  'runecraft:dawn-stone': 12_300,
  'smithing:dawnsteel-bar': 19_700,
  'cooking:cooked-dawn-sturgeon': 15_100,
  'fletching:dawnsteel-arrows': 9_800,
  'combat:sky-reaver': 11_600,
};

export function sage(ctx: Ctx, base: State, now: number): State {
  const made = grown(ctx, base, now);
  // The lanes at the last tier's work, as two years leave them.
  const then = now - 2 * 3_600_000;
  const cmds: Command[] = [
    { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'ancient-tree' } },
    { type: 'start', lane: 'artisan', action: { feature: 'smithing', id: 'dawnsteel-bar' } },
    { type: 'start', lane: 'combat', action: { feature: 'combat', id: 'sky-reaver' } },
  ];
  const working = cmds.reduce((st, c) => ctx.engine.command(st, then, c, seeded(st.seed)).state, made);
  return { ...working, mastery: { ...working.mastery, ...MASTERY } };
}

function grown(ctx: Ctx, base: State, now: number): State {
  const s = keeper(ctx, base, now);
  const kindled = (k: number) => ({ xp: Math.round(XP_TABLE[99] + (k + 0.4) * KINDLE_XP) });
  const skills = Object.fromEntries(
    allSkills().map((k) => [k, kindled(k === 'woodcutting' ? 8 : k === 'hitpoints' ? 7 : 6)]),
  );
  const paths = Object.fromEntries(allSkills().map((k) => [k, STYLES.includes(k) ? 'lore' : 'bounty']));
  const expeditions = s.features.expeditions as Record<string, unknown>;
  const deep = withDeep(s, 31, now).features.expeditions as { deep: Record<string, unknown> };
  // Two years have found every Uncommon and Rare find there is (the recap told the last tier's as first finds).
  const finds = items.catalog(FEATURES).filter((i) => ['uncommon', 'rare'].includes(findOf(i.id)?.rarity ?? ''));
  const found = Object.fromEntries(finds.map((f, i) => [f.id, now - (700 - i) * 86_400_000]));
  return {
    ...s,
    found: { ...s.found, ...found },
    skills,
    items: {
      ...s.items,
      gold: 9_312_408,
      ...Object.fromEntries(DAWN.map((id) => [id, 1])),
      'dawnsteel-bar': 1_204,
      dawnstone: 3_880,
      coal: 41_200,
      'wardens-feast': 860,
    },
    features: {
      ...s.features,
      kindling: { paths },
      combat: {
        ...(s.features.combat as object),
        worn: { weapon: 'dawnsteel-sword', helm: 'dawnsteel-helm', body: 'dawnsteel-body', legs: 'dawnsteel-legs' },
      },
      // Every worn piece tempered to its last step with boss trophies (session 216).
      smithing: { tempered: { 'dawnsteel-sword': 5, 'dawnsteel-helm': 5, 'dawnsteel-body': 5, 'dawnsteel-legs': 4 } },
      pedlar: { day: null, handed: [], favour: 612 },
      steading: {
        stages: { woodyard: 5, workshop: 5, 'training-yard': 5, smokehouse: 5, watchtower: 5, shrine: 5 },
      },
      expeditions: {
        ...expeditions,
        marks: 418,
        wins: Object.fromEntries(
          ['barrow-king', 'troll-chief', 'mire-mother', 'drowned-warden', 'storm-roc', 'ember-wyrm'].map((b, i) => [
            b,
            420 - i * 31,
          ]),
        ),
        deep: {
          ...deep.deep,
          deepest: 139,
          descents: 212,
          relics: { 'deep-satchel': 14, 'deep-lantern': 17, 'deep-edge': 16 },
        },
      },
    },
  };
}
