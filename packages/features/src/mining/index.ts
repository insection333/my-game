// Mining: the second gathering skill, built like Woodcutting. Its ores feed Smithing's bars; with the
// fire burning it can run in the second Gathering lane while Woodcutting runs in the first.
import { defineFeature } from '../define.ts';
import { gatheringRules } from '../shared/gathering.ts';
import { skillSlots } from '../shared/skill-slots.ts';
import { FINDS, ITEMS, LADDER, SKILL, VEINS } from './content.ts';

export const mining = defineFeature({
  id: 'mining',
  flag: { on: true, note: 'Playable since session 7' },
  content: {
    items: ITEMS,
    actions: VEINS.map(({ id, level, seconds, xp, gives }) => ({ id, level, seconds, xp, gives })),
    skill: { id: SKILL, ladder: LADDER },
    finds: FINDS,
  },
  effects: ['speed', 'extraYield', 'findChance', 'masteryGain'],
  stops: ['levelTooLow', 'storehouseFull'],
  rules: gatheringRules({ feature: 'mining', skill: SKILL, ladder: LADDER, finds: FINDS }, VEINS),
  routes: {},
  slots: skillSlots({ feature: 'mining', skill: SKILL, ladder: LADDER, finds: FINDS, actions: VEINS }),
  help: { title: 'help.mining.title', body: 'help.mining.body' },
});
