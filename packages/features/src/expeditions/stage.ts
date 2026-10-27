// One stage of a run, as the lane plays it: ten minutes of fights against the stage's foe (each won
// fight paying as the lane's do, under the run's twists), then the stage's mark, and a cache or a
// camp if the route put one there. A retreat ends the run where it stands.
import { TIER_LEVELS } from '@idle-clash/content';
import { give, seeded, take, type ActionContext, type State } from '@idle-clash/kernel';
import { itemOf, skillActions } from '../shared/catalog.ts';
import { foeById, type Foe } from '../shared/combat/data.ts';
import { fight } from '../shared/combat/fight.ts';
import { countWin, fightXp, spoils } from '../shared/combat/spoils.ts';
import { combatOf, fighterOf, healthAt, healthMax, mealsOf, setCombat } from '../shared/combat/state.ts';
import {
  CACHE_GOLD,
  product,
  ROADS,
  RUN_PAY,
  STAGE_MARKS,
  STAGE_MINUTES,
  TWISTS,
  type Twist,
} from '../shared/expeditions/data.ts';
import type { Run } from '../shared/expeditions/state.ts';

const REGION_TIER = { march: 4, fen: 6, peaks: 8 } as const;
const CACHE_SKILLS = ['woodcutting', 'mining', 'fishing'];

/** The twists in force at a stage: the run's own, and from the fork on, the road's. */
export function modsAt(run: Pick<Run, 'twists' | 'road' | 'fork'>, at: number): Twist[] {
  const twists = run.twists.flatMap((id) => TWISTS.filter((t) => t.id === id));
  const road = ROADS.filter((r) => r.id === run.road);
  return at >= run.fork ? [...twists, ...road] : twists;
}

/** How many fight stages a run has: fewer on the old roads. */
export const stageCount = (run: Pick<Run, 'stages' | 'twists'>) =>
  Math.max(1, Math.round(run.stages.length * product(modsAt({ ...run, road: '', fork: Infinity }, 0), 'stages')));

/** A foe made harder by the twists in force. */
export const hardened = (foe: Foe, mods: readonly Twist[]): Foe => ({
  ...foe,
  maxHit: Math.round(foe.maxHit * product(mods, 'foeHit')),
});

/** What a stage's cache holds: the region's top tier of logs, ore or fish (which, drawn for the stage
 *  from the seed, so the lane's check and its completion agree), worth the region's cache gold. */
export function cacheAt(state: State, run: Run): { item: string; count: number } | null {
  const tier = REGION_TIER[run.region];
  const options = CACHE_SKILLS.flatMap((skill) => {
    const a = skillActions()
      .find((s) => s.skill === skill)
      ?.actions.find((x) => x.level === TIER_LEVELS[tier - 1]);
    return a?.gives?.[0] ? [a.gives[0].item] : [];
  });
  if (!options.length) return null;
  const item = options[Math.floor(seeded(state.seed)('cache', run.seq * 64 + run.at) * options.length)];
  const value = Math.max(1, itemOf(item)?.value ?? 1);
  const gold = CACHE_GOLD[run.region] * product(modsAt(run, run.at), 'caches');
  return { item, count: Math.max(1, Math.round(gold / value)) };
}

export type StageEnd = 'cleared' | 'retreated';

/** Plays a fight stage: fights for ten minutes, then the mark, and the cache or the camp. */
export function playStage(ctx: ActionContext, run: Run): { end: StageEnd; marks: number } {
  const { state } = ctx;
  const stage = run.stages[run.at];
  const base = foeById(stage.foe)!;
  const mods = modsAt(run, run.at);
  const foe = hardened(base, mods);
  const r = seeded(ctx.seed ?? 0);
  let i = 0;
  const rng = () => r('stage', i++);
  let health = healthAt(state, ctx.startedAt);
  let t = 0;
  let end: StageEnd = 'cleared';
  while (t < STAGE_MINUTES * 60) {
    const p = fighterOf(state, base);
    if (!p) break;
    const f = fight(p, foe, rng, health, mealsOf(state), { hit: product(mods, 'hit'), heal: product(mods, 'heal') });
    for (const [item, n] of Object.entries(f.eaten)) take(state, item, n);
    if (p.supply) take(state, p.supply.item, 1);
    fightXp(ctx, p, base, f.dealt, product(mods, 'xp') * RUN_PAY);
    t += f.seconds;
    health = f.health;
    if (f.retreated) {
      end = 'retreated';
      break;
    }
    spoils(ctx, p, base, { drops: product(mods, 'drops'), finds: product(mods, 'finds'), gold: RUN_PAY });
    countWin(ctx, base.id);
  }
  if (end === 'cleared' && stage.after === 'camp')
    health = Math.min(healthMax(state), health + healthMax(state) * product(mods, 'camp'));
  setCombat(state, { ...combatOf(state), health, healthAt: ctx.at, retreated: null });
  if (end === 'retreated') return { end, marks: 0 };
  if (stage.after === 'cache') {
    const cache = cacheAt(state, run);
    if (cache) give(state, cache.item, cache.count);
  }
  return { end, marks: Math.round(STAGE_MARKS * product(mods, 'marks')) };
}
