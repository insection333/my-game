// Smithing: the Artisan lane's skill. Bars from ores, and gear from bars and logs: a sword, a staff
// and a bow per tier, so each combat style has its weapon, and a helm, legs and a body.
import { defineFeature } from '../define.ts';
import { skillSlots } from '../shared/skill-slots.ts';
import { FINDS, ITEMS, LADDER, RECIPES, SKILL } from './content.ts';
import { RULES } from './rules.ts';

export const smithing = defineFeature({
  id: 'smithing',
  flag: { on: true, note: 'Playable since session 7' },
  content: {
    items: ITEMS,
    actions: RECIPES.map(({ id, level, seconds, xp, gives, takes }) => ({ id, level, seconds, xp, gives, takes })),
    skill: { id: SKILL, ladder: LADDER },
    finds: FINDS,
  },
  effects: ['speed', 'saveInput', 'findChance', 'masteryGain'],
  stops: ['levelTooLow', 'outOfInputs'],
  rules: RULES,
  routes: {},
  slots: skillSlots({ feature: 'smithing', skill: SKILL, ladder: LADDER, finds: FINDS, actions: RECIPES }),
  help: { title: 'help.smithing.title', body: 'help.smithing.body' },
});
