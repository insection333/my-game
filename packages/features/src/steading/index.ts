// The steading (session 25): six works raised around the Hearth with gold and the player's own
// materials, five stages each, each stage a small lasting gain and a change to the Hearth's scene.
// Home: the Hearth.
import { z } from 'zod';
import { defineFeature, defineRoute, type Json } from '../define.ts';
import { raise } from './rules.ts';
import { steadingView } from './view.ts';

export type { SteadingView, WorkRow } from './view.ts';

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
      run: (state, input) => raise(state, input.work),
    }),
  },
  slots: {
    'hearth.steading': ({ state }) => steadingView(state) as unknown as Json,
    'hearth.work': ({ state }) => steadingView(state) as unknown as Json,
  },
  help: { title: 'help.steading.title', body: 'help.steading.body' },
});
