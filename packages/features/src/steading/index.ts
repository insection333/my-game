// The steading (session 25): six works raised around the Hearth with gold and the player's own
// materials, five stages each, each stage a small lasting gain and a change to the Hearth's scene.
// Home: the Hearth.
import { z } from 'zod';
import { defineFeature, defineRoute, type Json } from '../define.ts';
import { raise } from './rules.ts';
import { give } from './realm-give.ts';
import { realmWorkView } from './realm-view.ts';
import { steadingView } from './view.ts';

export type { SteadingView, WorkRow } from './view.ts';
export type { RealmWorkView } from './realm-view.ts';

export const steading = defineFeature({
  id: 'steading',
  flag: { on: true, note: 'The steading since session 25' },
  content: {},
  effects: [],
  stops: [],
  rules: {},
  routes: {
    raise: defineRoute({
      input: z.object({ work: z.string().regex(/^[a-z][a-z-]{0,31}$/) }).strict(),
      example: { work: 'woodyard' },
      run: (state, input, now) => raise(state, input.work, now),
    }),
    // The realm's work (session 218): gold, or all of a material held.
    give: defineRoute({
      input: z
        .object({
          gold: z.number().int().min(1).max(1e15).optional(),
          item: z
            .string()
            .regex(/^[a-z0-9][a-z0-9-]{0,63}$/)
            .optional(),
        })
        .strict(),
      example: { gold: 1000 },
      run: (state, input, now) => give(state, input, now),
    }),
  },
  slots: {
    'hearth.steading': ({ state }) => steadingView(state) as unknown as Json,
    'hearth.work': ({ state }) => steadingView(state) as unknown as Json,
    'hearth.realmWork': ({ state, now }) => realmWorkView(state, now) as unknown as Json,
  },
  help: { title: 'help.steading.title', body: 'help.steading.body' },
});
