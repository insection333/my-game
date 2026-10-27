// A boss fight, at a run's end or once a day in the Combat lane: one fight, decided by the seed its
// repetition drew (so it lasts as long as it plays). A win pays the boss's gold, its marks (half
// again with its Legendary find), XP, and maybe one of its two finds.
import { give, seeded, take, type ActionContext, type State } from '@idle-clash/kernel';
import { fight, type Fought } from '../shared/combat/fight.ts';
import { fightXp } from '../shared/combat/spoils.ts';
import { combatOf, fighterOf, healthAt, mealsOf, setCombat } from '../shared/combat/state.ts';
import { BOSS_FINDS, LEGENDARY_MARKS, product, type Boss, type Twist } from '../shared/expeditions/data.ts';
import { expeditionsOf, setExpeditions } from '../shared/expeditions/state.ts';
import { relicFindPct } from '../shared/expeditions/relics.ts';

/** A boss made harder by the twists in force: more health, harder hits. */
export const bossUnder = (boss: Boss, mods: readonly Twist[]): Boss => ({
  ...boss,
  hp: Math.round(boss.hp * product(mods, 'bossHp')),
  maxHit: Math.round(boss.maxHit * product(mods, 'foeHit')),
});

/** The fight this repetition plays: the same in `duration` (from its start) and `complete`. */
export function playBoss(ctx: ActionContext, boss: Boss, mods: readonly Twist[]): Fought | null {
  const p = fighterOf(ctx.state, boss);
  if (!p) return null;
  const r = seeded(ctx.seed ?? 0);
  let i = 0;
  return fight(p, bossUnder(boss, mods), () => r('boss', i++), healthAt(ctx.state, ctx.startedAt), mealsOf(ctx.state), {
    hit: product(mods, 'hit'),
    heal: product(mods, 'heal'),
  });
}

/** The UTC day a moment falls on (2026-10-28): a boss rests a day after it is fought in the lane. */
export const dayOf = (at: number): string => new Date(at).toISOString().slice(0, 10);

/** Whether a boss has been fought in the lane today. */
export const restedToday = (state: State, boss: Boss, at: number) => {
  const days = expeditionsOf(state).bossDay;
  return Object.hasOwn(days, boss.id) && days[boss.id] === dayOf(at);
};

/** Fights a boss and pays for a win. Returns whether it fell, the marks it paid and any find. */
export function fightBoss(
  ctx: ActionContext,
  boss: Boss,
  mods: readonly Twist[],
): { won: boolean; marks: number; find: string | null } {
  const { state } = ctx;
  const f = playBoss(ctx, boss, mods);
  const p = fighterOf(state, boss);
  if (!f || !p) return { won: false, marks: 0, find: null };
  for (const [item, n] of Object.entries(f.eaten)) take(state, item, n);
  if (p.supply) take(state, p.supply.item, 1);
  setCombat(state, { ...combatOf(state), health: f.health, healthAt: ctx.at, retreated: null });
  fightXp(ctx, p, boss, f.dealt, product(mods, 'xp'));
  if (f.retreated) return { won: false, marks: 0, find: null };
  give(state, 'gold', boss.gold);
  give(state, boss.drop, 1);
  const legendary = Object.hasOwn(state.found, boss.finds.legendary);
  const marks = Math.round(boss.marks * product(mods, 'marks') * (legendary ? LEGENDARY_MARKS : 1));
  // A find: the Legendary first, then the Rare, more likely in the fog, at the old shrine and with
  // the four-leaf charm.
  const chance = product(mods, 'finds') * (1 + relicFindPct(state) / 100);
  const roll = ctx.roll();
  const find =
    roll < BOSS_FINDS.legendary * chance
      ? boss.finds.legendary
      : roll < BOSS_FINDS.rare * chance
        ? boss.finds.rare
        : null;
  if (find) {
    const first = !Object.hasOwn(state.found, find);
    give(state, find, 1);
    if (first) state.found[find] = ctx.at;
    const rarity = find === boss.finds.legendary ? 'legendary' : 'rare';
    ctx.emit({ type: 'find', at: ctx.at, skill: 'expeditions', item: find, rarity, first });
  }
  const e = expeditionsOf(state);
  const wins = Object.hasOwn(e.wins, boss.id) ? e.wins[boss.id] : 0;
  setExpeditions(state, { ...e, marks: e.marks + marks, wins: { ...e.wins, [boss.id]: wins + 1 } });
  return { won: true, marks, find };
}
