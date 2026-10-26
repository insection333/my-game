// A third player for the screenshots: two months into the climb, in the Sunken Fen. Levels in the
// fifties to seventies, tier 5 and 6 gear and materials, the later foods (bought and cooked), and all three lanes at work
// on the Fen's actions. Their names are the longest yet ("Deep star-iron seam", "Grandmaster ..."),
// and their numbers the largest, so the pages are held to their spec where it is hardest.
import { XP_TABLE } from '@idle-clash/content';
import { FEATURES } from '@idle-clash/features';
import { seeded, type Command, type State } from '@idle-clash/kernel';
import type { Ctx } from '../../../apps/server/src/context.ts';

const LEVELS: Record<string, number> = {
  woodcutting: 71,
  mining: 64,
  fishing: 58,
  smithing: 60,
  cooking: 56,
  melee: 66,
  archery: 48,
  magic: 52,
  hitpoints: 68,
};

const ITEMS: Record<string, number> = {
  gold: 48_765_432,
  'maple-logs': 12_480,
  'silverbark-logs': 3_310,
  'elderwood-logs': 96,
  coal: 18_240,
  'moonsilver-ore': 6_002,
  'star-iron-ore': 2_115,
  'moonsilver-bar': 1_840,
  'star-iron-bar': 412,
  'star-iron-sword': 1,
  'moonsilver-bow': 1,
  'moonsilver-staff': 1,
  'star-iron-helm': 1,
  'star-iron-body': 1,
  'star-iron-legs': 1,
  'roast-fowl': 340,
  'hunters-feast': 120,
  'moon-carp': 1_204,
  'silver-eel': 936,
  'cooked-silver-eel': 264,
  'carp-pie': 88,
  'pearl-mussel': 3,
  'amber-nugget': 4,
  'rough-sapphire': 2,
  'heartwood-knot': 1,
};

export function elder(ctx: Ctx, base: State, now: number): State {
  const then = now - 2 * 3600_000;
  const s: State = {
    ...base,
    clock: then,
    lastSeen: then,
    fireUntil: then,
    luck: { misses: 0, lastMoment: then },
    skills: Object.fromEntries(Object.entries(LEVELS).map(([k, l]) => [k, { xp: XP_TABLE[l] + 1 }])),
    items: ITEMS,
    found: Object.fromEntries(
      ['birds-nest', 'amber-nugget', 'carved-acorn', 'heartwood-knot', 'rough-garnet', 'rough-sapphire'].map((f, i) => [
        f,
        now - (60 - i * 7) * 86_400_000,
      ]),
    ),
    mastery: {
      'woodcutting:silverbark-tree': 9_800,
      'mining:deep-star-iron-seam': 2_150,
      'smithing:star-iron-bar': 1_420,
      'combat:mire-hulk': 3_300,
      'fishing:silver-eel-shallows': 1_900,
      'cooking:cooked-moon-carp': 2_400,
    },
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
        milestones: ['total-50', 'total-100', 'total-150', 'total-200', 'total-250', 'total-280', 'total-350'],
      },
      combat: {
        worn: { weapon: 'star-iron-sword', helm: 'star-iron-helm', body: 'star-iron-body', legs: 'star-iron-legs' },
        health: null,
        healthAt: then,
        retreated: null,
      },
      storehouse: { enlargements: 10 },
    },
  };
  const cmds: Command[] = [
    { type: 'start', lane: 'gathering', action: { feature: 'woodcutting', id: 'old-silverbark' } },
    { type: 'start', lane: 'artisan', action: { feature: 'smithing', id: 'star-iron-bar' } },
    { type: 'start', lane: 'combat', action: { feature: 'combat', id: 'mire-hulk' } },
  ];
  const working = cmds.reduce((st, c) => ctx.engine.command(st, then, c, seeded(st.seed)).state, s);
  const goals = FEATURES.find((f) => f.id === 'goals')!;
  return goals.routes.refresh.run(working, {}, now).state;
}
