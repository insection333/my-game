// Woodcutting: the first skill, and the model every skill copies: trees over four tiers, perks on
// every level, mastery, six finds and their place in the collection log.
import { defineFeature } from '../define.ts';
import { skillSlots } from '../shared/skill-slots.ts';
import { FINDS, ITEMS, LADDER, SKILL, TREES } from './content.ts';
import { RULES } from './rules.ts';

export const woodcutting = defineFeature({
  id: 'woodcutting',
  flag: { on: true, note: 'Playable since session 6' },
  content: {
    items: ITEMS,
    actions: TREES.map((tree) => ({
      id: tree.id,
      level: tree.level,
      seconds: tree.seconds,
      xp: tree.xp,
      gives: [{ item: tree.logs, count: tree.count }],
    })),
    skill: { id: SKILL, ladder: LADDER },
    finds: FINDS,
  },
  effects: ['speed', 'extraYield', 'findChance', 'masteryGain'],
  stops: ['levelTooLow'],
  rules: RULES,
  routes: {},
  slots: skillSlots({
    feature: 'woodcutting',
    skill: SKILL,
    ladder: LADDER,
    finds: FINDS,
    actions: TREES.map((tree) => ({ ...tree, gives: [{ item: tree.logs, count: tree.count }] })),
  }),
  help: { title: 'help.woodcutting.title', body: 'help.woodcutting.body' },
});
