// Woodcutting: the first feature. Its flag stays off until session 6 adds finds, the collection log
// and its page; until then the manifest and content checks hold it to the same standard as any feature.
import { defineFeature } from '../define.ts';
import { skillSlots } from '../shared/skill-slots.ts';
import { ITEMS, LADDER, SKILL, TREES } from './content.ts';
import { RULES } from './rules.ts';

export const woodcutting = defineFeature({
  id: 'woodcutting',
  flag: { on: false, note: 'Playable from session 6, with finds, the collection log and its page' },
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
  },
  effects: ['speed', 'extraYield', 'findChance', 'masteryGain'],
  stops: ['levelTooLow'],
  rules: RULES,
  routes: {},
  slots: skillSlots({
    feature: 'woodcutting',
    skill: SKILL,
    ladder: LADDER,
    actions: TREES.map((tree) => ({ ...tree, gives: [{ item: tree.logs, count: tree.count }] })),
  }),
  help: { title: 'help.woodcutting.title', body: 'help.woodcutting.body' },
});
