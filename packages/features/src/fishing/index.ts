// Fishing: the third gathering skill, built like Woodcutting and Mining. Its fish feed Cooking; with the
// fire burning it can run in the second Gathering lane beside another gathering skill.
import { defineFeature } from '../define.ts';
import { gatheringRules } from '../shared/gathering.ts';
import { skillSlots } from '../shared/skill-slots.ts';
import { FINDS, ITEMS, LADDER, SKILL, WATERS } from './content.ts';

export const fishing = defineFeature({
  id: 'fishing',
  flag: { on: true, note: 'Playable since session 13' },
  content: {
    items: ITEMS,
    actions: WATERS.map(({ id, level, seconds, xp, gives }) => ({ id, level, seconds, xp, gives })),
    skill: { id: SKILL, ladder: LADDER },
    finds: FINDS,
  },
  effects: ['speed', 'extraYield', 'findChance', 'masteryGain'],
  stops: ['levelTooLow', 'storehouseFull'],
  rules: gatheringRules({ feature: 'fishing', skill: SKILL, ladder: LADDER, finds: FINDS }, WATERS),
  routes: {},
  slots: skillSlots({ feature: 'fishing', skill: SKILL, ladder: LADDER, finds: FINDS, actions: WATERS }),
  help: { title: 'help.fishing.title', body: 'help.fishing.body' },
});
