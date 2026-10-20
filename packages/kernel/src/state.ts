// A new player's state, and the small helpers features use to read and change shared state.
import { LANE_IDS, type Lane, type LaneId, type State } from './schema.ts';

const idleLane = (): Lane => ({ current: null, next: null, stopped: null, rolls: 0 });

export function newState(seed: number, now: number): State {
  return {
    seed: seed >>> 0,
    clock: now,
    lastSeen: now,
    fireUntil: now,
    lanes: Object.fromEntries(LANE_IDS.map((l) => [l, idleLane()])) as Record<LaneId, Lane>,
    items: {},
    skills: {},
    mastery: {},
    features: {},
  };
}

export const countOf = (s: State, item: string): number => (Object.hasOwn(s.items, item) ? s.items[item] : 0);

/** Content ids: lower case, digits and hyphens. Keeps names like __proto__ out of state. */
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
function assertId(kind: string, id: string): void {
  if (!ID.test(id)) throw new Error(`${kind} id "${id}" must be lower case letters, digits and hyphens`);
}

export function give(s: State, item: string, n: number): void {
  assertId('item', item);
  if (!Number.isInteger(n) || n < 0) throw new Error(`give: ${n} ${item} is not a whole, non-negative amount`);
  if (n > 0) s.items[item] = countOf(s, item) + n;
}

/** Takes n of an item if there are enough; returns whether it did. */
export function take(s: State, item: string, n: number): boolean {
  if (!Number.isInteger(n) || n < 0) throw new Error(`take: ${n} ${item} is not a whole, non-negative amount`);
  const have = countOf(s, item);
  if (have < n) return false;
  if (have === n) delete s.items[item];
  else s.items[item] = have - n;
  return true;
}

export const xpOf = (s: State, skill: string): number => (Object.hasOwn(s.skills, skill) ? s.skills[skill].xp : 0);

export function addXp(s: State, skill: string, xp: number): void {
  assertId('skill', skill);
  if (!Number.isInteger(xp) || xp < 0) throw new Error(`addXp: ${xp} is not a whole, non-negative amount`);
  s.skills[skill] = { xp: xpOf(s, skill) + xp };
}

export const fireBurning = (s: State, at: number): boolean => at < s.fireUntil;
