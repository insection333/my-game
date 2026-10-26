// A new player's state, and the small helpers features use to read and change shared state.
import { LANE_IDS, type ActionRef, type Lane, type LaneId, type LaneKind, type State } from './schema.ts';

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
    luck: { misses: 0, lastMoment: now },
    found: {},
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

/** Adds XP, which may have a fraction (an action's XP with a bonus); thousandths carry over. */
export function addXp(s: State, skill: string, xp: number): void {
  assertId('skill', skill);
  if (!Number.isFinite(xp) || xp < 0) throw new Error(`addXp: ${xp} is not a non-negative amount`);
  const had = Object.hasOwn(s.skills, skill) ? s.skills[skill] : { xp: 0 };
  const total = had.xp * 1000 + (had.part ?? 0) + Math.round(xp * 1000);
  const part = total % 1000;
  s.skills[skill] = part ? { xp: (total - part) / 1000, part } : { xp: total / 1000 };
}

export const fireBurning = (s: State, at: number): boolean => at < s.fireUntil;
/** How long the fire has burned without going out, in minutes, at a moment (0 when out). */
export const fireMinutes = (s: State, at: number): number =>
  fireBurning(s, at) ? Math.max(0, at - (s.fireSince ?? at)) / 60_000 : 0;

/**
 * The lane an action of a kind should start in. A gathering action takes the first Gathering lane
 * when it is free or already runs that skill; while the fire burns and the first lane runs another
 * skill, it takes the second (cut wood and mine at once); otherwise it replaces what the first runs.
 */
export function laneFor(s: State, now: number, action: ActionRef, kind: LaneKind): LaneId {
  if (kind !== 'gathering') return kind;
  const first = s.lanes.gathering.current;
  if (!first || first.action.feature === action.feature) return 'gathering';
  const second = s.lanes.gathering2.current;
  if (fireBurning(s, now) && (!second || second.action.feature === action.feature)) return 'gathering2';
  return 'gathering';
}

/** A notable moment happened: the luck guarantee counts from here. */
export function noteMoment(s: State, at: number): void {
  s.luck.lastMoment = Math.min(s.clock, Math.max(s.luck.lastMoment, at));
}
