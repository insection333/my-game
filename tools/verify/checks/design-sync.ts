// The game's content against the design: the XP table, each skill's ladder (as the player reads it)
// and each gathering action's numbers must match what GAME_DESIGN.md says.
import {
  LEGENDARY_CHANCE,
  LUCK_GUARANTEE_MS,
  LUCK_STEP,
  RARE_CHANCE,
  RARITIES,
  t,
  XP_TABLE,
} from '@idle-clash/content';
import { skill, type Feature } from '@idle-clash/features';
import {
  FINDS,
  LUCK_GUARANTEE_SECONDS,
  LUCK_STEP as MODEL_LUCK_STEP,
  MINING,
  RARITY,
  WOODCUTTING,
} from '../../../design/model/content.ts';
import { fmtUnlock } from '../../../design/model/format.ts';
import { unlockTable } from '../../../design/model/unlocks.ts';

const DESIGN_SKILLS = ['woodcutting', 'mining', 'smithing', 'melee', 'archery', 'magic', 'hitpoints'] as const;
const DESIGN_ACTIONS: Record<string, typeof WOODCUTTING> = { woodcutting: WOODCUTTING, mining: MINING };

export function checkDesign(features: readonly Feature[], modelXp: number[]): string[] {
  const problems: string[] = [];
  if (JSON.stringify(modelXp) !== JSON.stringify(XP_TABLE)) {
    problems.push("packages/content's XP table differs from the model's (design/model/xp-table.json)");
  }
  const ours = [LUCK_STEP, LUCK_GUARANTEE_MS / 1000, RARE_CHANCE, LEGENDARY_CHANCE];
  const theirs = [MODEL_LUCK_STEP, LUCK_GUARANTEE_SECONDS, RARITY[1].chance, RARITY[2].chance];
  if (JSON.stringify(ours) !== JSON.stringify(theirs))
    problems.push(`Find chances and luck ${JSON.stringify(ours)} differ from the design's ${JSON.stringify(theirs)}`);
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
    for (let level = 1; level <= 40; level++) {
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
