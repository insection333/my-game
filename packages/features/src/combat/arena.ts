// The arena (session 42): the fight in the Combat lane, swing by swing, as the Combat page plays it out.
// Each fight is decided by the seed its repetition drew when it began (rules.ts), so the page can play
// the very same fight the engine will settle: the same hits, the same misses, the same meals. Nothing
// here changes the game; it only shows it.
//
// In time with the lane (session 46): the engine settles each exchange at once, the fighter's swing and
// the foe's together, every SWING_S, and ends a won fight on a breather of one swing. The page shows the
// fighter's swing half a swing before the foe's answer, so both are seen, and plays the breather first,
// as the two square up: so the felling blow lands half a swing before the lane ends, and the spoils the
// lane then pays follow it at once. While a fight lasts, the fighter's health
// anywhere on the page is the fight's own (healthShown), not the save's health returning with time. A
// boss fought in the lane once a day (expeditions' bossRules) is played out the same way.
import { seeded, type State } from '@idle-clash/kernel';
import { foeById, SWING_S, type Foe } from '../shared/combat/data.ts';
import { BOSSES } from '../shared/expeditions/data.ts';
import { fight, maxHealth, type Fought, type Swing } from '../shared/combat/fight.ts';
import { fighterOf, healthAt, mealsOf } from '../shared/combat/state.ts';

/** A swing and the moment the page shows it. */
export type Shown = Swing & { at: number };

export interface Arena {
  foe: Foe;
  /** A boss fought on its own (once a day), not a foe of the Foes list. */
  boss: boolean;
  /** When this fight began and when it ends (the next foe arrives, or the retreat). */
  startedAt: number;
  endsAt: number;
  /** Health at the start, and the most it can be. */
  health: number;
  most: number;
  /** Every swing in the order the page shows them. */
  swings: Shown[];
  /** When the felling blow lands; null when the fighter retreats. */
  slainAt: number | null;
  fought: Fought;
}

/** Where the fight stands at a moment, as the page shows it. */
export interface ArenaNow {
  /** Swings shown so far. */
  count: number;
  health: number;
  foeHp: number;
  latest: Shown | null;
  /** The fighter's latest swing, and the foe's latest swing or meal eaten: each side's last number. */
  yours: Shown | null;
  theirs: Shown | null;
  slain: boolean;
  /** When the next swing shows, if one is still to come. */
  next: number | null;
}

let cached: { key: string; arena: Arena | null } | null = null;

/** The fight the Combat lane is in, or null when it is not fighting a foe; worked out once a fight. */
export function arenaOf(state: State): Arena | null {
  const run = state.lanes.combat.current;
  if (!run || run.seed === undefined) return null;
  const boss = run.action.feature === 'expeditions' ? BOSSES.find((b) => b.id === run.action.id) : undefined;
  if (run.action.feature !== 'combat' && !boss) return null;
  const key = [state.seed, run.action.feature, run.action.id, run.startedAt, run.seed, healthAt(state, run.startedAt)];
  if (cached?.key !== key.join(':')) {
    const foe = boss ?? foeById(run.action.id);
    cached = {
      key: key.join(':'),
      arena: foe ? playOut(state, foe, !!boss, run.startedAt, run.endsAt, run.seed) : null,
    };
  }
  return cached.arena;
}

function playOut(state: State, foe: Foe, boss: boolean, startedAt: number, endsAt: number, seed: number) {
  const p = fighterOf(state, foe);
  if (!p) return null;
  // As the rules play it: the same seed, the same draws in the same order, the health it began with (a
  // boss in the lane draws under its own name and meets no twists).
  const r = seeded(seed);
  let i = 0;
  const health = healthAt(state, startedAt);
  const swings: Shown[] = [];
  const lead = (SWING_S / 2) * 1000;
  const draw = boss ? 'boss' : 'fight';
  const log: Swing[] = [];
  const fought = fight(
    p,
    foe,
    () => r(draw, i++),
    health,
    mealsOf(state),
    {},
    (s) => log.push(s),
  );
  // A retreat ends on its last exchange, with no breather to play first.
  const opening = fought.retreated ? 0 : SWING_S * 1000;
  for (const s of log) swings.push({ ...s, at: startedAt + opening + s.t * 1000 - (s.by === 'you' ? lead : 0) });
  swings.sort((a, b) => a.at - b.at);
  const felled = fought.retreated ? undefined : swings.find((s) => s.by === 'you' && s.foeHp <= 0);
  const arena: Arena = {
    foe,
    boss,
    startedAt,
    endsAt,
    health,
    most: maxHealth(p),
    swings,
    slainAt: felled?.at ?? null,
    fought,
  };
  return arena;
}

export function arenaAt(a: Arena, now: number): ArenaNow {
  let count = 0;
  while (count < a.swings.length && a.swings[count].at <= now) count++;
  const shown = a.swings.slice(0, count);
  const latest = shown.at(-1) ?? null;
  return {
    count,
    health: latest ? latest.health : a.health,
    foeHp: latest ? Math.max(0, latest.foeHp) : a.foe.hp,
    latest,
    yours: shown.findLast((s) => s.by === 'you') ?? null,
    theirs: shown.findLast((s) => s.by !== 'you') ?? null,
    slain: a.slainAt !== null && now >= a.slainAt,
    next: a.swings[count]?.at ?? null,
  };
}

/** The fighter's health as the page shows it: the fight's own while one lasts, else as it returns. Past
 *  a fight's end and before the page's clock has settled it (under a second), the health the fight ended
 *  on, which the next fight begins with. */
export function healthShown(state: State, now: number): number {
  const a = arenaOf(state);
  if (!a) return healthAt(state, now);
  return now < a.endsAt ? arenaAt(a, now).health : a.fought.health;
}
