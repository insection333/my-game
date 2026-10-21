// A second player for the screenshots: three weeks in, with levels in every skill, a full Storehouse,
// gear worn, food carried, finds in the log, and all three lanes at work since 8 hours ago. A page
// that holds its spec for a newcomer can still overflow once rows carry odds, pills and long names.
import { XP_TABLE } from '@idle-clash/content';
import { FEATURES } from '@idle-clash/features';
import { seeded, type Command, type State } from '@idle-clash/kernel';
import type { Ctx } from '../../../apps/server/src/context.ts';

const LEVELS: Record<string, number> = {
  woodcutting: 22,
  mining: 18,
  smithing: 20,
  melee: 21,
  archery: 8,
  magic: 12,
  hitpoints: 20,
};

const ITEMS: Record<string, number> = {
  gold: 1_234_567,
  'pine-logs': 1_840,
  'oak-logs': 612,
  'copper-ore': 950,
  'tin-ore': 420,
  'iron-ore': 233,
  coal: 88,
  'bronze-bar': 140,
  'iron-bar': 36,
  'iron-sword': 1,
  'bronze-sword': 1,
  'bronze-bow': 1,
  'copper-staff': 1,
  'bronze-helm': 1,
  'bronze-body': 1,
  'bronze-legs': 1,
  bread: 40,
  'meat-pie': 25,
  'birds-nest': 3,
  'amber-nugget': 1,
  'battle-trophy': 2,
};

/** The veteran, last here 8 hours ago with all three lanes at work: the Hearth opens on the recap. */
export function veteran(ctx: Ctx, base: State, now: number): State {
  const then = now - 8 * 3600_000;
  const s: State = {
    ...base,
    clock: then,
    lastSeen: then,
    fireUntil: then,
    luck: { misses: 0, lastMoment: then },
    skills: Object.fromEntries(Object.entries(LEVELS).map(([k, l]) => [k, { xp: XP_TABLE[l] + 1 }])),
    items: ITEMS,
    found: {
      'birds-nest': now - 9 * 86_400_000,
      'amber-nugget': now - 4 * 86_400_000,
      'battle-trophy': now - 86_400_000,
    },
    mastery: { 'woodcutting:oak-tree': 2_400, 'smithing:bronze-bar': 900, 'combat:orc-raider': 520 },
    features: {
      ...base.features,
      goals: {
        claimed: [
          'chop-a-pine',
          'mine-copper-ore',
          'smelt-a-copper-bar',
          'forge-a-copper-sword',
          'wear-your-sword',
          'defeat-a-hollow-rat',
        ],
      },
      combat: {
        worn: { weapon: 'iron-sword', helm: 'bronze-helm', body: 'bronze-body', legs: 'bronze-legs' },
        health: 420,
        healthAt: then,
        retreated: null,
      },
    },
  };
  const cmds: Command[] = [
    { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'oak-tree' } },
    { type: 'start', lane: 'artisan', action: { feature: 'smithing', id: 'bronze-bar' } },
    { type: 'start', lane: 'combat', action: { feature: 'combat', id: 'orc-raider' } },
  ];
  const working = cmds.reduce((st, c) => ctx.engine.command(st, then, c, seeded(st.seed)).state, s);
  // Today's goals already made, so opening the Hearth sends nothing (which would end the time away).
  const goals = FEATURES.find((f) => f.id === 'goals')!;
  return goals.routes.refresh.run(working, {}, now).state;
}
