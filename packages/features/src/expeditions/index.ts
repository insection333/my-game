// Expeditions and bosses (docs/EXPANSION.md, step 16): runs into a region for 1 to 8 hours in the Combat
// lane, each a route of fight stages, caches and camps drawn fresh, with twists and a fork, ending in
// the region's boss; each boss fought alone once a day; and relics bought with the marks they pay.
// Home: the Expeditions tab of the Combat page.
import { z } from 'zod';
import { defineFeature, defineRoute, type Json } from '../define.ts';
import { bossLog, relicsView } from './relics-view.ts';
import { abandon, buyRelic, setOut } from './routes.ts';
import { RULES } from './rules.ts';
import { CONTENT } from './content.ts';
import { bossRows, expeditionView } from './views.ts';

export type { BossRow, ExpeditionView, RegionTab, RouteView, RunView, StageChip, TwistView } from './views.ts';
export type { RelicRow, RelicsView } from './relics-view.ts';
export { routeView } from './views.ts';

export const expeditions = defineFeature({
  id: 'expeditions',
  flag: { on: true, note: 'Expeditions, bosses and relics since session 16' },
  content: CONTENT,
  effects: [],
  stops: ['expeditionHome', 'bossRested', 'noWeapon', 'tooHurt', 'hitpointsTooLow', 'storehouseFull'],
  rules: RULES,
  routes: {
    setOut: defineRoute({
      input: z
        .object({
          region: z.enum(['march', 'fen', 'peaks']),
          hours: z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(8)]),
          road: z.string().regex(/^[a-z][a-z-]{0,31}$/),
        })
        .strict(),
      example: { region: 'march' as const, hours: 1 as const, road: 'high-pass' },
      run: (state, input) => setOut(state, input.region, input.hours, input.road),
    }),
    abandon: defineRoute({
      input: z.object({}).strict(),
      example: {},
      run: (state) => abandon(state),
    }),
    relic: defineRoute({
      input: z.object({ relic: z.string().regex(/^[a-z][a-z-]{0,63}$/) }).strict(),
      example: { relic: 'hearthstone' },
      run: (state, input) => buyRelic(state, input.relic),
    }),
  },
  slots: {
    'combat.expedition': ({ state }) => expeditionView(state) as unknown as Json,
    'combat.bosses': ({ state, now }) => bossRows(state, now) as unknown as Json,
    'combat.relics': ({ state }) => relicsView(state) as unknown as Json,
    'collection.log': ({ state }) => bossLog(state) as unknown as Json,
  },
  help: { title: 'help.expeditions.title', body: 'help.expeditions.body' },
});
