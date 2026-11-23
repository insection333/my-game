// Combat: the foes fought in the Combat lane, the gear worn, and the Combat page's slots. The four
// combat skills (Melee, Archery, Magic, Hitpoints) are features of their own; all share
// shared/combat/ for the triangle, the foes and how a fight resolves.
import { GEAR_SLOTS, Id, type GearSlot, type Item } from '@idle-clash/content';
import { z } from 'zod';
import { defineFeature, defineRoute } from '../define.ts';
import { FOES, FOODS } from '../shared/combat/data.ts';
import { remove, wear } from './gear.ts';
import { RULES } from './rules.ts';
import { SLOTS_FILLED } from './slots.ts';
import { bountyView, claim, letGo, take } from './bounty.ts';
import { bountyErrands } from './errands.ts';
import type { Json } from '../define.ts';

/** Food: sold by the vendor (session 9) for its price; it sells back for half. */
const ITEMS: Item[] = FOODS.map((f) => ({ id: f.id, kind: 'food', value: Math.floor(f.price / 2), heals: f.heals }));

export const combat = defineFeature({
  id: 'combat',
  flag: { on: true, note: 'Playable since session 8' },
  content: {
    items: ITEMS,
    // A foe opens at a Hitpoints level; the gold and drop are what a defeat leaves.
    actions: FOES.map((f) => ({ id: f.id, level: f.hitpoints, gives: [{ item: f.drop, count: 1 }] })),
  },
  effects: [],
  stops: ['hitpointsTooLow', 'noWeapon', 'retreated', 'tooHurt', 'storehouseFull'],
  rules: RULES,
  routes: {
    wear: defineRoute({
      input: z.object({ item: Id }).strict(),
      example: { item: 'copper-sword' },
      run: (state, input) => wear(state, input.item),
    }),
    remove: defineRoute({
      input: z.object({ slot: z.enum(GEAR_SLOTS) }).strict(),
      example: { slot: 'weapon' },
      run: (state, input) => remove(state, input.slot as GearSlot),
    }),
    // The bounty board (session 175).
    bounty: defineRoute({
      input: z.object({ foe: Id }).strict(),
      example: { foe: 'hollow-rat' },
      run: (state, input, now) => take(state, input.foe, now),
    }),
    bountyClaim: defineRoute({
      input: z.object({}).strict(),
      example: {},
      run: (state, _input, now) => claim(state, now),
    }),
    bountyLetGo: defineRoute({
      input: z.object({}).strict(),
      example: {},
      run: (state) => letGo(state),
    }),
  },
  slots: {
    ...SLOTS_FILLED,
    'combat.bounty': ({ state, now }) => bountyView(state, now) as unknown as Json,
    'hearth.errands': ({ state, now }) => bountyErrands(state, now) as unknown as Json,
  },
  help: { title: 'help.combat.title', body: 'help.combat.body' },
});
