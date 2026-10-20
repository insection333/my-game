// Woodcutting's action rules: a tree takes its seconds, made faster by perks and mastery, and gives
// its logs, sometimes one more, and XP (more while the fire burns). Finds arrive in session 6.
import { FIRE_XP_PCT } from '@idle-clash/content';
import { addXp, give, type ActionRules } from '@idle-clash/kernel';
import { actionModifiers, skillLevel, yieldOf } from '../shared/skill.ts';
import { LADDER, SKILL, TREES, type Tree } from './content.ts';

const FEATURE = 'woodcutting';

function chop(tree: Tree): ActionRules {
  return {
    lane: 'gathering',
    check: (ctx) =>
      skillLevel(ctx.state, SKILL) < tree.level ? { code: 'levelTooLow', detail: { level: tree.level } } : null,
    duration: (ctx) => {
      const m = actionModifiers(ctx.state, SKILL, LADDER, FEATURE, tree.id);
      return (tree.seconds * 1000) / (1 + m.speed / 100);
    },
    complete: (ctx) => {
      const m = actionModifiers(ctx.state, SKILL, LADDER, FEATURE, tree.id);
      give(
        ctx.state,
        tree.logs,
        yieldOf(tree.count, m.extraYield, () => ctx.roll()),
      );
      addXp(ctx.state, SKILL, Math.round(tree.xp * (ctx.fireBurning ? 1 + FIRE_XP_PCT / 100 : 1)));
    },
  };
}

export const RULES: Record<string, ActionRules> = Object.fromEntries(TREES.map((tree) => [tree.id, chop(tree)]));
