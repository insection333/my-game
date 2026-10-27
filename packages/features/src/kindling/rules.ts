// Kindling's one route: taking a Path for a skill at 99, or leaving it (null). Free, and changed as
// often as the player likes: a Path is a way to play, never a choice to regret.
import { MAX_LEVEL } from '@idle-clash/content';
import type { GameEvent, State } from '@idle-clash/kernel';
import { kindlingOf, pathById, pathSkills } from '../shared/kindling.ts';
import { skillLevel } from '../shared/skill.ts';

export type PathResult = { ok: true } | { ok: false; reason: 'unknown' | 'notTop' };
type Answer = { state: State; result: PathResult; events: GameEvent[] };

export function choosePath(state: State, skill: string, path: string | null): Answer {
  const no = (reason: 'unknown' | 'notTop'): Answer => ({ state, result: { ok: false, reason }, events: [] });
  if (!pathSkills().includes(skill) || (path !== null && !pathById(path))) return no('unknown');
  if (skillLevel(state, skill) < MAX_LEVEL) return no('notTop');
  const k = kindlingOf(state);
  const paths = { ...k.paths };
  if (path === null) delete paths[skill];
  else paths[skill] = path as 'bounty' | 'lore' | 'fortune';
  const out = structuredClone(state);
  out.features.kindling = { ...k, paths };
  return { state: out, result: { ok: true }, events: [] };
}
