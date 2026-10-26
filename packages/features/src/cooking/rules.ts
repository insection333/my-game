// Cooking's rules, as Smithing's: a recipe opens at its level and needs all it takes before each repetition
// ("Out of perch" stops the lane and starts its Next action); it completes through the shared
// completion, where Thrifty may save an ingredient.
import type { ActionRules, StopReason } from '@idle-clash/kernel';
import { completeSkillAction, missingInput, type SkillDefinition } from '../shared/complete.ts';
import { actionModifiers, skillLevel } from '../shared/skill.ts';
import { noRoom } from '../shared/storehouse.ts';
import { FINDS, LADDER, RECIPES, SKILL, type Dish } from './content.ts';

const DEF: SkillDefinition = { feature: 'cooking', skill: SKILL, ladder: LADDER, finds: FINDS };

function cook(r: Dish): ActionRules {
  return {
    lane: 'artisan',
    check: (ctx): StopReason | null => {
      if (skillLevel(ctx.state, SKILL) < r.level) return { code: 'levelTooLow', detail: { level: r.level } };
      const missing = missingInput(ctx.state, r.takes);
      if (missing) return { code: 'outOfInputs', detail: { item: missing } };
      return noRoom(
        ctx.state,
        r.gives.map((g) => g.item),
        r.takes,
      );
    },
    duration: (ctx) => {
      const m = actionModifiers(ctx.state, SKILL, LADDER, DEF.feature, r.id);
      return (r.seconds * 1000) / (1 + m.speed / 100);
    },
    complete: (ctx) => completeSkillAction(ctx, DEF, r),
  };
}

export const RULES: Record<string, ActionRules> = Object.fromEntries(RECIPES.map((r) => [r.id, cook(r)]));
