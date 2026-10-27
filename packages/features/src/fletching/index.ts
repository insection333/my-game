// Fletching: the Artisan lane's third skill. Each tier's arrows, Archery's supply, 25 at a time from a
// bar and a log.
import { defineFeature } from '../define.ts';
import { skillSlots } from '../shared/skill-slots.ts';
import { FINDS, ITEMS, LADDER, RECIPES, SKILL } from './content.ts';
import { RULES } from './rules.ts';

export const fletching = defineFeature({
  id: 'fletching',
  flag: { on: true, note: 'Playable since session 14' },
  content: {
    items: ITEMS,
    actions: RECIPES.map(({ id, level, seconds, xp, gives, takes }) => ({ id, level, seconds, xp, gives, takes })),
    skill: { id: SKILL, ladder: LADDER },
    finds: FINDS,
  },
  effects: ['extraYield', 'saveInput', 'findChance', 'masteryGain'],
  stops: ['levelTooLow', 'outOfInputs', 'storehouseFull'],
  rules: RULES,
  routes: {},
  slots: skillSlots({ feature: 'fletching', skill: SKILL, ladder: LADDER, finds: FINDS, actions: RECIPES }),
  help: { title: 'help.fletching.title', body: 'help.fletching.body' },
});
