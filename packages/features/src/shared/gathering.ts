// A gathering skill from its tiers: a standard action and a rich one (four levels later, slower, two
// items) per tier, their items, finds and unlock ladder, and rules that complete through the shared
// completion. Woodcutting, Mining, Fishing and Runecraft are all built from this, so they read and play
// alike; a tier may need an item kept (Runecraft's keys) and give several at once (its runes).
import {
  buildLadder,
  fillPerks,
  TIER_LEVELS,
  TIER_SECONDS,
  TIER_XP_PER_HOUR,
  type Effect,
  type Find,
  type Item,
  type Style,
} from '@idle-clash/content';
import { countOf, type ActionRules } from '@idle-clash/kernel';
import { completeSkillAction, type SkillDefinition } from './complete.ts';
import { noRoom } from './storehouse.ts';
import { actionModifiers, skillLevel } from './skill.ts';

export interface GatheringTier {
  /** The item the tier gives, and what the vendor pays for one. */
  item: string;
  value: number;
  standard: string;
  rich: string;
  /** An item both actions need but keep (a standing stone's key). */
  needs?: string;
  /** Items one action gives (Runecraft draws eight runes at once); one if not said. */
  per?: number;
}

export interface GatheringSpec {
  feature: string;
  skill: string;
  tiers: GatheringTier[];
  /** Four perk lines that take turns on every level holding nothing else, and the two capstones. */
  perks: { perk: string; effect: Effect }[];
  capstones: Record<number, { perk: string; effect: Effect }>;
  finds: Find[];
  /** What the vendor pays for each find (Legendary ones are trophies: 0). */
  findValues: Record<string, number>;
  /** When what it gives is a supply (Runecraft's runes), the style that uses it. */
  supplyFor?: Style;
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
  /** What it needs to have but keeps. */
  needs?: { item: string }[];
  /** Rare and Legendary finds roll at this multiple per action (the same per hour). */
  findMultiple: number;
}

export function gatheringContent(spec: GatheringSpec) {
  const actions: GatherAction[] = spec.tiers.flatMap((t, i) => {
    const seconds = TIER_SECONDS[i];
    const xp = Math.round((TIER_XP_PER_HOUR[i] * seconds) / 3600);
    const level = TIER_LEVELS[i];
    const per = t.per ?? 1;
    const needs = t.needs ? { needs: [{ item: t.needs }] } : {};
    return [
      {
        id: t.standard,
        level,
        tier: i + 1,
        rich: false,
        seconds,
        xp,
        gives: [{ item: t.item, count: per }],
        ...needs,
        findMultiple: 1,
      },
      {
        id: t.rich,
        level: level + 4,
        tier: i + 1,
        rich: true,
        seconds: seconds * 1.5,
        xp: Math.round(xp * 1.3),
        gives: [{ item: t.item, count: 2 * per }],
        ...needs,
        findMultiple: 1.5,
      },
    ];
  });
  const items: Item[] = [
    ...spec.tiers.map((t, i): Item =>
      spec.supplyFor
        ? { id: t.item, kind: 'supply', value: t.value, supply: { style: spec.supplyFor, tier: i + 1 } }
        : { id: t.item, kind: 'resource', value: t.value },
    ),
    ...spec.finds.map((f): Item => ({ id: f.item, kind: 'find', value: spec.findValues[f.item] ?? 0 })),
  ];
  const ladder = fillPerks(buildLadder(actions, []), spec.perks, spec.capstones);
  return { actions, items, ladder };
}

/** Rules for every action of a gathering skill: open at its level, faster with perks and mastery. */
export function gatheringRules(def: SkillDefinition, actions: GatherAction[]): Record<string, ActionRules> {
  const rules = (a: GatherAction): ActionRules => ({
    lane: 'gathering',
    check: (ctx) => {
      if (skillLevel(ctx.state, def.skill) < a.level) return { code: 'levelTooLow', detail: { level: a.level } };
      const key = a.needs?.find((n) => countOf(ctx.state, n.item) === 0);
      if (key) return { code: 'needsKey', detail: { item: key.item } };
      return noRoom(
        ctx.state,
        a.gives.map((g) => g.item),
      );
    },
    duration: (ctx) => {
      const m = actionModifiers(ctx.state, def.skill, def.ladder, def.feature, a.id);
      return (a.seconds * 1000) / (1 + m.speed / 100);
    },
    complete: (ctx) => completeSkillAction(ctx, def, a),
  });
  return Object.fromEntries(actions.map((a) => [a.id, rules(a)]));
}
