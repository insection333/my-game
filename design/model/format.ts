// The model's unlock text: what GAME_DESIGN.md prints. Kept apart from tables.ts (which runs the
// model) so verify can compare the game's real ladders against it cheaply.
import type { Effect, Unlock } from './unlocks.ts';

export function formatEffect(e: Effect): string {
  switch (e.kind) {
    case 'speed':
      return `${e.pct}% faster`;
    case 'extraYield':
      return `+${e.pct}% chance of an extra item`;
    case 'findChance':
      return `Rare and Legendary finds ${e.pct}% likelier`;
    case 'masteryGain':
      return `mastery ${e.pct}% faster`;
    case 'saveInput':
      return `${e.pct}% chance to save an ingredient`;
    case 'damage':
      return `+${e.pct}% damage`;
    case 'accuracy':
      return `+${e.pct}% to hit`;
    case 'guard':
      return `${e.pct}% less damage taken`;
    case 'spoils':
      return `+${e.pct}% gold and drops`;
    case 'maxHealth':
      return `+${e.amount * 10} health`;
    case 'regen':
      return `health returns ${e.pct}% faster`;
    case 'foodHeal':
      return `food heals ${e.pct}% more`;
    case 'retreatAt':
      return `retreat at ${e.pct}% health instead of 20%`;
  }
}
export const fmtUnlock = (u: Unlock) =>
  u.type === 'perk'
    ? u.total
      ? `${u.name} (${formatEffect(u.total)} in all)`
      : `${u.name} (${formatEffect(u.effect)})`
    : u.type === 'foe'
      ? `Foe: ${u.name}`
      : u.name;
