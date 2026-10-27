// Deeds and titles (docs/EXPANSION.md, step 15): about 280 deeds made from the game's content, each
// with its moment when done, worth points by tier; points and particular deeds unlock titles shown
// beside your name on the hiscores, banners' colours and frames for the Hearth's plaque. Home: a
// Deeds tab on Hiscores.
import { Id } from '@idle-clash/content';
import { z } from 'zod';
import { defineFeature, defineRoute, type Json } from '../define.ts';
import { honoursView, plaqueView } from './honours-view.ts';
import { pending } from './list.ts';
import { choose, refresh } from './rules.ts';
import { deedsView } from './view.ts';

export type { DeedCategory, DeedFamily, DeedRow, DeedStep, DeedsView } from './view.ts';
export type { HonourChoice, HonourOption, HonoursView, PlaqueView } from './honours-view.ts';

export const deeds = defineFeature({
  id: 'deeds',
  flag: { on: true, note: 'Deeds, points and honours since session 15' },
  content: {},
  effects: [],
  stops: [],
  rules: {},
  routes: {
    refresh: defineRoute({
      input: z.object({}).strict(),
      example: {},
      run: (state, _input, now) => refresh(state, now),
    }),
    choose: defineRoute({
      input: z.object({ kind: z.enum(['title', 'banner', 'frame']), id: Id.nullable() }).strict(),
      example: { kind: 'banner', id: 'woad' },
      run: (state, input, _now) => choose(state, input.kind, input.id),
    }),
  },
  slots: {
    // Deeds done but not yet recorded, by id: the shell asks the server to record them as they change.
    'shell.deeds': ({ state, now }) => ({
      pending: pending(state, now)
        .map((d) => d.id)
        .join(' '),
    }),
    'hearth.plaque': ({ state }) => plaqueView(state) as unknown as Json,
    'hiscores.honours': ({ state }) => honoursView(state) as unknown as Json,
    'hiscores.deeds': ({ state, now }) => deedsView(state, now) as unknown as Json,
  },
  help: { title: 'help.deeds.title', body: 'help.deeds.body' },
});
