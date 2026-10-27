// Runecraft: the fourth gathering skill, built like the others. Its runes are Magic's supply; a standing
// stone past the first needs its tier's key, which Smithing binds.
import { defineFeature } from '../define.ts';
import { gatheringRules } from '../shared/gathering.ts';
import { skillSlots } from '../shared/skill-slots.ts';
import { FINDS, ITEMS, LADDER, SKILL, STONES } from './content.ts';

export const runecraft = defineFeature({
  id: 'runecraft',
  flag: { on: true, note: 'Playable since session 14' },
  content: {
    items: ITEMS,
    actions: STONES.map(({ id, level, seconds, xp, gives, needs }) => ({
      id,
      level,
      seconds,
      xp,
      gives,
      ...(needs ? { needs } : {}),
    })),
    skill: { id: SKILL, ladder: LADDER },
    finds: FINDS,
  },
  effects: ['speed', 'extraYield', 'findChance', 'masteryGain'],
  stops: ['levelTooLow', 'needsKey', 'storehouseFull'],
  rules: gatheringRules({ feature: 'runecraft', skill: SKILL, ladder: LADDER, finds: FINDS }, STONES),
  routes: {},
  slots: skillSlots({ feature: 'runecraft', skill: SKILL, ladder: LADDER, finds: FINDS, actions: STONES }),
  help: { title: 'help.runecraft.title', body: 'help.runecraft.body' },
});
