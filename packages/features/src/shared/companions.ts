// Companions (session 179): seventeen small creatures (fourteen until session 210), one for each skill and each boss, that join a player
// by chance and are shown beside their picture (the Hearth's plaque, their card, the ladders). Cosmetic
// only: a companion gives nothing, so finding one is a delight and never a duty. Each joins at a point drawn
// from the save's own seed: a skill's somewhere between levels 30 and 90 of it (so the first comes in the
// first weeks and every one before 99), a boss's somewhere within its first thirty wins. The point is never
// shown, only its span, so each arrives as luck does.
import { MAX_LEVEL, XP_TABLE } from '@idle-clash/content';
import { seeded, xpOf, type State } from '@idle-clash/kernel';
import { expeditionsOf } from './expeditions/state.ts';

export interface Companion {
  id: string;
  /** The skill it joins you in, or the boss it follows you from. */
  skill?: string;
  boss?: string;
}

export const COMPANIONS: readonly Companion[] = [
  { id: 'squirrel', skill: 'woodcutting' },
  { id: 'mole', skill: 'mining' },
  { id: 'otter', skill: 'fishing' },
  { id: 'moth', skill: 'runecraft' },
  { id: 'salamander', skill: 'smithing' },
  { id: 'cat', skill: 'cooking' },
  { id: 'goose', skill: 'fletching' },
  { id: 'hound', skill: 'melee' },
  { id: 'falcon', skill: 'archery' },
  { id: 'toad', skill: 'magic' },
  { id: 'tortoise', skill: 'hitpoints' },
  { id: 'barrow-raven', boss: 'barrow-king' },
  { id: 'stone-whelp', boss: 'troll-chief' },
  { id: 'mire-newt', boss: 'mire-mother' },
  { id: 'lantern-frog', boss: 'drowned-warden' },
  { id: 'roc-chick', boss: 'storm-roc' },
  { id: 'wyrmling', boss: 'ember-wyrm' },
];

/** The span a skill's companion joins within, in levels; a boss's, in wins. */
export const COMPANION_LEVELS = [30, 90] as const;
export const COMPANION_WINS = [5, 30] as const;

export const companionById = (id: string) => COMPANIONS.find((c) => c.id === id);

/** The point this save's companion joins at: XP in its skill, or wins over its boss. */
export function companionAt(state: Pick<State, 'seed'>, c: Companion): number {
  const r = seeded(state.seed)(`companion:${c.id}`, 0);
  if (c.boss) return COMPANION_WINS[0] + Math.floor(r * (COMPANION_WINS[1] - COMPANION_WINS[0] + 1));
  const level = COMPANION_LEVELS[0] + r * (COMPANION_LEVELS[1] - COMPANION_LEVELS[0]);
  const whole = Math.min(MAX_LEVEL - 1, Math.floor(level));
  return Math.round(XP_TABLE[whole] + (level - whole) * (XP_TABLE[whole + 1] - XP_TABLE[whole]));
}

/** Whether a companion has joined this save. */
export function companionFound(state: State, c: Companion): boolean {
  if (c.boss) {
    const wins = expeditionsOf(state).wins;
    return (Object.hasOwn(wins, c.boss) ? wins[c.boss] : 0) >= companionAt(state, c);
  }
  return xpOf(state, c.skill!) >= companionAt(state, c);
}
