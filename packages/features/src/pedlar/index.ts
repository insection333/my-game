// The pedlar (session 217, the plan *Dead and short content, 23 November*): a travelling pedlar on the
// Hearth's Next up each day, wanting three lots of what the player has or makes (an Uncommon find, an older
// tier's material, a dish), each handed in at one press for gold and a favour. Uncommon finds and old stock
// are worth keeping for the pedlar; Sell finds stays for the overflow. Home: the Hearth.
import { z } from 'zod';
import { defineFeature, defineRoute, type Json } from '../define.ts';
import { handIn } from './rules.ts';
import { pedlarErrands, pedlarView } from './view.ts';

export type { LotRow, PedlarView } from './view.ts';
export { pedlarPaidWords, PEDLAR_HREF } from './view.ts';

export const pedlar = defineFeature({
  id: 'pedlar',
  flag: { on: true, note: 'The pedlar since session 217' },
  content: {},
  effects: [],
  stops: [],
  rules: {},
  routes: {
    handIn: defineRoute({
      input: z.object({ kind: z.enum(['find', 'material', 'dish']) }).strict(),
      example: { kind: 'find' as const },
      run: (state, input, now) => handIn(state, input.kind, now),
    }),
  },
  slots: {
    'hearth.pedlar': ({ state, now }) => pedlarView(state, now) as unknown as Json,
    'hearth.errands': ({ state, now }) => pedlarErrands(state, now) as unknown as Json,
  },
  help: { title: 'help.pedlar.title', body: 'help.pedlar.body' },
});
