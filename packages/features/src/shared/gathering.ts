// A gathering skill from its tiers: a standard action and a rich one (four levels later, slower, two
// items) per tier, their items, finds and unlock ladder, and rules that complete through the shared
// completion. Woodcutting and Mining are both built from this, so they read and play alike.
import {
  buildLadder,
  TIER_LEVELS,
  TIER_SECONDS,
  TIER_XP_PER_HOUR,
  type Find,
  type Item,
  type PerkLine,
} from '@idle-clash/content';
import type { ActionRules } from '@idle-clash/kernel';
import { completeSkillAction, type SkillDefinition } from './complete.ts';
import { actionModifiers, skillLevel } from './skill.ts';

export interface GatheringTier {
  /** The item the tier gives, and what the vendor pays for one. */
  item: string;
  value: number;
  standard: string;
  rich: string;
}

export interface GatheringSpec {
  feature: string;
  skill: string;
  tiers: GatheringTier[];
  perks: PerkLine[];
  finds: Find[];
  /** What the vendor pays for each find (Legendary ones are trophies: 0). */
  findValues: Record<string, number>;
}

export interface GatherAction {
  id: string;
  level: number;
  tier: number;
  /** Rich actions are slower and give two items. */
  rich: boolean;
  seconds: number;
  xp: number;
  gives: { item: string; count: number }[];
  /** Rare and Legendary finds roll at this multiple per action (the same per hour). */
  findMultiple: number;
}

export function gatheringContent(spec: GatheringSpec) {
  const actions: GatherAction[] = spec.tiers.flatMap((t, i) => {
    const seconds = TIER_SECONDS[i];
    const xp = Math.round((TIER_XP_PER_HOUR[i] * seconds) / 3600);
    const level = TIER_LEVELS[i];
    return [
      {
        id: t.standard,
        level,
        tier: i + 1,
        rich: false,
        seconds,
        xp,
        gives: [{ item: t.item, count: 1 }],
        findMultiple: 1,
      },
      {
        id: t.rich,
        level: level + 4,
        tier: i + 1,
        rich: true,
        seconds: seconds * 1.5,
        xp: Math.round(xp * 1.3),
        gives: [{ item: t.item, count: 2 }],
        findMultiple: 1.5,
      },
    ];
  });
  const items: Item[] = [
    ...spec.tiers.map((t): Item => ({ id: t.item, kind: 'resource', value: t.value })),
    ...spec.finds.map((f): Item => ({ id: f.item, kind: 'find', value: spec.findValues[f.item] ?? 0 })),
  ];
  const ladder = buildLadder(actions, spec.perks);
  return { actions, items, ladder };
}

/** Rules for every action of a gathering skill: open at its level, faster with perks and mastery. */
export function gatheringRules(def: SkillDefinition, actions: GatherAction[]): Record<string, ActionRules> {
  const rules = (a: GatherAction): ActionRules => ({
    lane: 'gathering',
    check: (ctx) =>
      skillLevel(ctx.state, def.skill) < a.level ? { code: 'levelTooLow', detail: { level: a.level } } : null,
    duration: (ctx) => {
      const m = actionModifiers(ctx.state, def.skill, def.ladder, def.feature, a.id);
      return (a.seconds * 1000) / (1 + m.speed / 100);
    },
    complete: (ctx) => completeSkillAction(ctx, def, a),
  });
  return Object.fromEntries(actions.map((a) => [a.id, rules(a)]));
}
