// Woodcutting's action rules: a tree takes its seconds, made faster by perks and mastery; each chop
// may turn up a find, gives its logs (sometimes one more) and XP, through the shared completion.
import type { ActionRules } from '@idle-clash/kernel';
import { completeSkillAction, type SkillDefinition } from '../shared/complete.ts';
import { actionModifiers, skillLevel } from '../shared/skill.ts';
import { FINDS, LADDER, SKILL, TREES, type Tree } from './content.ts';

const DEF: SkillDefinition = { feature: 'woodcutting', skill: SKILL, ladder: LADDER, finds: FINDS };

function chop(tree: Tree): ActionRules {
  const act = { ...tree, gives: [{ item: tree.logs, count: tree.count }] };
  return {
    lane: 'gathering',
    check: (ctx) =>
      skillLevel(ctx.state, SKILL) < tree.level ? { code: 'levelTooLow', detail: { level: tree.level } } : null,
    duration: (ctx) => {
      const m = actionModifiers(ctx.state, SKILL, LADDER, DEF.feature, tree.id);
      return (tree.seconds * 1000) / (1 + m.speed / 100);
    },
    complete: (ctx) => completeSkillAction(ctx, DEF, act),
  };
}

export const RULES: Record<string, ActionRules> = Object.fromEntries(TREES.map((tree) => [tree.id, chop(tree)]));
