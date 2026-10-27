// Your standing, shared by goals (the Hearth's plaque, milestones) and deeds (ranks as deeds): every
// skill, the total level, and a rank that rises with it, from a newcomer's Wanderer to the Legend of
// the Realm at every skill's top level. Ranks are spaced for the whole expansion's climb
// (docs/EXPANSION.md): close together early, so the first few come in the first days.
import type { State } from '@idle-clash/kernel';
import { skillActions } from './catalog.ts';
import { HITPOINTS, STYLE_SKILLS } from './combat/data.ts';
import { skillLevel } from './skill.ts';

/** Every skill: those with actions of their own, the three styles and Hitpoints. */
export const allSkills = (): string[] => [...skillActions().map((s) => s.skill), ...STYLE_SKILLS, HITPOINTS];

/** The sum of every skill's level (a newcomer's is 11; every skill at the top makes 1,089). */
export const totalLevel = (state: State): number => allSkills().reduce((n, s) => n + skillLevel(state, s), 0);

/** Each rank and the total level it starts at. */
export const RANKS: readonly { id: string; total: number }[] = [
  { id: 'wanderer', total: 0 },
  { id: 'settler', total: 20 },
  { id: 'hand', total: 50 },
  { id: 'journeyman', total: 100 },
  { id: 'yeoman', total: 150 },
  { id: 'warden', total: 200 },
  { id: 'master', total: 280 },
  { id: 'fenwalker', total: 400 },
  { id: 'knight', total: 550 },
  { id: 'peakstrider', total: 700 },
  { id: 'ashlord', total: 850 },
  { id: 'dawnbringer', total: 1000 },
  { id: 'legend', total: 1089 },
];

export const rankAt = (total: number) => [...RANKS].reverse().find((r) => total >= r.total)!;
