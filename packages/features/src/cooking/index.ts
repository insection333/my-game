// Cooking: the Artisan lane's second skill. Fish and logs into food that heals more for its worth than
// the vendor's from tier 2; from tier 3, pies and stews that use the tier before's fish as well.
import { defineFeature } from '../define.ts';
import { skillSlots } from '../shared/skill-slots.ts';
import { FINDS, ITEMS, LADDER, RECIPES, SKILL } from './content.ts';
import { RULES } from './rules.ts';

export const cooking = defineFeature({
  id: 'cooking',
  flag: { on: true, note: 'Playable since session 13' },
  content: {
    items: ITEMS,
    actions: RECIPES.map(({ id, level, seconds, xp, gives, takes }) => ({ id, level, seconds, xp, gives, takes })),
    skill: { id: SKILL, ladder: LADDER },
    finds: FINDS,
  },
  effects: ['speed', 'saveInput', 'findChance', 'masteryGain'],
  stops: ['levelTooLow', 'outOfInputs', 'storehouseFull'],
  rules: RULES,
  routes: {},
  slots: skillSlots({ feature: 'cooking', skill: SKILL, ladder: LADDER, finds: FINDS, actions: RECIPES }),
  help: { title: 'help.cooking.title', body: 'help.cooking.body' },
});
