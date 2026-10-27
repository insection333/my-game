// Kindling (docs/EXPANSION.md, step 17, in place of Rekindling): past 99 a skill's XP keeps counting
// towards Kindlings, each a flame on its seal and a stronger Path; at 99 a skill takes a Path (Bounty,
// Lore or Fortune), changed as often as the player likes. Nothing is reset or taken away. Home: each
// skill's own page.
import { z } from 'zod';
import { defineFeature, defineRoute, type Json } from '../define.ts';
import { choosePath } from './rules.ts';
import { kindlingViews } from './view.ts';

export type { KindlingView } from './view.ts';

export const kindling = defineFeature({
  id: 'kindling',
  flag: { on: true, note: 'Kindlings and Paths past 99 since session 17' },
  content: {},
  effects: [],
  stops: [],
  rules: {},
  routes: {
    path: defineRoute({
      input: z
        .object({
          skill: z.string().regex(/^[a-z][a-z-]{0,31}$/),
          path: z.enum(['bounty', 'lore', 'fortune']).nullable(),
        })
        .strict(),
      example: { skill: 'woodcutting', path: 'bounty' as const },
      run: (state, input) => choosePath(state, input.skill, input.path),
    }),
  },
  slots: {
    'skill.kindling': ({ state }) => kindlingViews(state) as unknown as Json,
  },
  help: { title: 'help.kindling.title', body: 'help.kindling.body' },
});
