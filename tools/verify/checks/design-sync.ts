// The game's content against the design: the XP table, each skill's ladder (as the player reads it)
// and each gathering action's numbers must match what GAME_DESIGN.md says.
import {
  LEGENDARY_CHANCE,
  LUCK_GUARANTEE_MS,
  LUCK_STEP,
  MAX_LEVEL,
  RARE_CHANCE,
  RARITIES,
  t,
  XP_TABLE,
} from '@idle-clash/content';
import { combatData, expeditionData, skill, storehouseData, type Feature } from '@idle-clash/features';
import * as relicData from '../../../packages/features/src/shared/expeditions/relics.ts';
import * as MODEL_EXP from '../../../design/model/expeditions.ts';
import {
  FOES as MODEL_FOES,
  FOODS as MODEL_FOODS,
  FINDS,
  FISHING,
  LUCK_GUARANTEE_SECONDS,
  RUNECRAFT,
  LUCK_STEP as MODEL_LUCK_STEP,
  MINING,
  RARITY,
  SMITHING,
  STOREHOUSE,
  WOODCUTTING,
} from '../../../design/model/content.ts';
import { COOKING } from '../../../design/model/cooking.ts';
import { FLETCHING, SMITHING_SUPPLIES } from '../../../design/model/supplies.ts';
import { fmtUnlock } from '../../../design/model/format.ts';
import { unlockTable } from '../../../design/model/unlocks.ts';

const DESIGN_SKILLS = [
  'woodcutting',
  'mining',
  'fishing',
  'runecraft',
  'smithing',
  'cooking',
  'fletching',
  'melee',
  'archery',
  'magic',
  'hitpoints',
] as const;
const DESIGN_ACTIONS: Record<string, readonly (typeof WOODCUTTING)[number][]> = {
  woodcutting: WOODCUTTING,
  mining: MINING,
  fishing: FISHING,
  runecraft: RUNECRAFT,
};

export function checkDesign(features: readonly Feature[], modelXp: number[]): string[] {
  const problems: string[] = [];
  if (JSON.stringify(modelXp) !== JSON.stringify(XP_TABLE)) {
    problems.push("packages/content's XP table differs from the model's (design/model/xp-table.json)");
  }
  const ours = [LUCK_STEP, LUCK_GUARANTEE_MS / 1000, RARE_CHANCE, LEGENDARY_CHANCE];
  const theirs = [MODEL_LUCK_STEP, LUCK_GUARANTEE_SECONDS, RARITY[1].chance, RARITY[2].chance];
  if (JSON.stringify(ours) !== JSON.stringify(theirs))
    problems.push(`Find chances and luck ${JSON.stringify(ours)} differ from the design's ${JSON.stringify(theirs)}`);
  // Foes and foods, number for number (a built combat feature reads these).
  // The Storehouse's space and the price of each enlargement.
  if (features.some((f) => f.id === 'storehouse')) {
    const ours = [storehouseData.START_SLOTS, storehouseData.SLOTS_PER_ENLARGEMENT, ...storehouseData.ENLARGE_COSTS];
    const theirs = [STOREHOUSE.startSlots, STOREHOUSE.slotsPerEnlargement, ...STOREHOUSE.costs];
    if (JSON.stringify(ours) !== JSON.stringify(theirs))
      problems.push(`The Storehouse ${JSON.stringify(ours)} differs from the design's ${JSON.stringify(theirs)}`);
  }
  if (features.some((f) => f.id === 'combat')) {
    const ours = combatData.FOES.map((x) => [
      t(`action.combat.${x.id}`),
      x.style,
      x.level,
      x.hitpoints,
      x.tier,
      x.hp,
      x.maxHit,
      x.gold,
      t(`item.${x.drop}`),
    ]);
    const theirs = MODEL_FOES.map((x) => [
      x.name,
      x.style,
      x.level,
      x.hitpoints,
      x.tier,
      x.hp,
      x.maxHit,
      x.gold,
      x.drop,
    ]);
    if (JSON.stringify(ours) !== JSON.stringify(theirs))
      problems.push(`Foes differ from the design: ${JSON.stringify(ours)} against ${JSON.stringify(theirs)}`);
    const food = (xs: { heals: number; price: number; level: number }[]) => xs.map((x) => [x.heals, x.price, x.level]);
    if (JSON.stringify(food([...combatData.FOODS])) !== JSON.stringify(food(MODEL_FOODS)))
      problems.push('Foods differ from the design (heals, price, level)');
  }
  if (features.some((f) => f.id === 'expeditions')) problems.push(...checkExpeditions());
  for (const f of features) {
    const sk = f.content.skill;
    if (!sk) continue;
    const id = DESIGN_SKILLS.find((s) => s === sk.id);
    if (!id) {
      problems.push(`Feature "${f.id}": skill "${sk.id}" is not in GAME_DESIGN.md`);
      continue;
    }
    if (id !== 'hitpoints') {
      const names = RARITIES.map((r) =>
        (f.content.finds ?? []).filter((x) => x.rarity === r).map((x) => t(`item.${x.item}`)),
      );
      if (JSON.stringify(names) !== JSON.stringify(FINDS[id]))
        problems.push(`Feature "${f.id}": finds ${JSON.stringify(names)}, the design ${JSON.stringify(FINDS[id])}`);
    }
    const model = unlockTable(id);
    for (let level = 1; level <= MAX_LEVEL; level++) {
      let ours: string[];
      try {
        ours = sk.ladder[level - 1].map((u) => skill.unlockText(f.id, sk.ladder, u));
      } catch (err) {
        problems.push(`Feature "${f.id}", level ${level}: ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
      const theirs = model.get(level)!.map(fmtUnlock);
      if (JSON.stringify(ours) !== JSON.stringify(theirs)) {
        problems.push(
          `Feature "${f.id}", level ${level}: the game says "${ours.join('; ')}", the design "${theirs.join('; ')}"`,
        );
      }
    }
    if (sk.id === 'smithing') problems.push(...checkRecipes(f, [...SMITHING, ...SMITHING_SUPPLIES]));
    if (sk.id === 'fletching') problems.push(...checkRecipes(f, FLETCHING));
    if (sk.id === 'cooking') problems.push(...checkRecipes(f, COOKING));
    const designActions = DESIGN_ACTIONS[sk.id];
    if (!designActions) continue;
    for (const d of designActions) {
      const a = (f.content.actions ?? []).find((x) => t(`action.${f.id}.${x.id}`) === d.name);
      if (!a) problems.push(`Feature "${f.id}" has no action named "${d.name}" (GAME_DESIGN.md)`);
      else {
        const ours = { level: a.level, seconds: a.seconds, xp: a.xp, count: a.gives?.[0]?.count };
        const theirs = { level: d.level, seconds: d.seconds, xp: d.xp, count: d.qty };
        if (JSON.stringify(ours) !== JSON.stringify(theirs)) {
          problems.push(
            `Feature "${f.id}": "${d.name}" is ${JSON.stringify(ours)}, the design says ${JSON.stringify(theirs)}`,
          );
        }
      }
    }
  }
  return problems;
}

/** Smithing's and Cooking's recipes against the design: level, seconds, XP, what each takes and makes,
 *  what it sells for, and (for food) what it heals. */
function checkRecipes(
  f: Feature,
  recipes: readonly ((typeof SMITHING)[number] & { makes?: number; heals?: number })[],
) {
  const problems: string[] = [];
  const nameOf = (id: string) => t(`item.${id}`);
  for (const d of recipes) {
    const a = (f.content.actions ?? []).find((x) => t(`action.${f.id}.${x.id}`) === d.name);
    if (!a) {
      problems.push(`Feature "${f.id}" has no recipe named "${d.name}" (GAME_DESIGN.md)`);
      continue;
    }
    const item = (f.content.items ?? []).find((i) => i.id === a.gives?.[0]?.item);
    const takes = Object.fromEntries((a.takes ?? []).map((x) => [nameOf(x.item), x.count]));
    const ours = {
      level: a.level,
      seconds: a.seconds,
      xp: a.xp,
      takes,
      makes: a.gives?.[0]?.count,
      value: item?.value,
      heals: item?.heals,
    };
    const theirs = {
      level: d.level,
      seconds: d.seconds,
      xp: d.xp,
      takes: d.inputs,
      makes: d.makes ?? 1,
      value: d.value,
      heals: d.heals,
    };
    if (JSON.stringify(ours) !== JSON.stringify(theirs))
      problems.push(
        `Feature "${f.id}": "${d.name}" is ${JSON.stringify(ours)}, the design says ${JSON.stringify(theirs)}`,
      );
  }
  return problems;
}

/** Expeditions, bosses and relics against the design, number for number. */
function checkExpeditions(): string[] {
  const e = expeditionData;
  const twists = (xs: readonly { id: string }[]) => JSON.stringify(xs.map((x) => ({ ...x })));
  const ours = {
    lengths: [...e.LENGTHS],
    stage: [e.STAGE_MINUTES, e.STAGES_PER_HOUR, e.STAGE_MARKS, e.RUN_PAY, e.SECOND_TWIST, ...e.FOE_WEIGHTS],
    bosses: e.BOSSES.map((b) => [t(`boss.${b.id}`), b.style, b.level, b.hitpoints, b.hp, b.maxHit, b.gold, b.marks]),
    caches: [e.CACHE_GOLD.march, e.CACHE_GOLD.fen, e.CACHE_GOLD.peaks],
    finds: [e.BOSS_FINDS.rare, e.BOSS_FINDS.legendary],
    twists: twists(e.TWISTS),
    roads: twists(e.ROADS),
    relics: [
      ...relicData.RELIC_COSTS,
      relicData.SKILL_XP_PER_RANK,
      relicData.FOOD_HEAL_PER_RANK,
      relicData.FINDS_PER_RANK,
      relicData.SLOTS_PER_RANK,
      relicData.STORE_RANKS,
    ],
  };
  const m = MODEL_EXP;
  const theirs = {
    lengths: m.LENGTHS,
    stage: [m.STAGE_MINUTES, m.STAGES_PER_HOUR, m.STAGE_MARKS, m.RUN_PAY, m.SECOND_TWIST, ...m.FOE_WEIGHTS],
    bosses: m.BOSSES.map((b) => [b.name, b.style, b.level, b.hitpoints, b.hp, b.maxHit, b.gold, b.marks]),
    caches: m.CACHE_GOLD,
    finds: [m.BOSS_FINDS.rare, m.BOSS_FINDS.legendary],
    twists: twists(m.TWISTS),
    roads: twists(m.ROADS),
    relics: [
      ...m.RELIC_COSTS,
      m.RELICS.skillXpPerRank,
      m.RELICS.foodHealPerRank,
      m.RELICS.findsPerRank,
      m.RELICS.storeSlotsPerRank,
      m.RELICS.storeRanks,
    ],
  };
  return Object.keys(ours).flatMap((k) => {
    const [a, b] = [JSON.stringify(ours[k as keyof typeof ours]), JSON.stringify(theirs[k as keyof typeof theirs])];
    return a === b ? [] : [`Expeditions' ${k} ${a} differ from the design's ${b}`];
  });
}
