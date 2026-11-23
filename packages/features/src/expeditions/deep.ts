// The Deep's rules (session 212; the descent and its numbers in shared/expeditions/deep.ts): a descent is
// begun from the deepest waystone (`descend`), and each repetition of the Combat lane's `deep` action goes
// one depth down: ten minutes of fights against the best three of the Peaks' foes for the fighter, grown by
// the depth, or at a tenth depth a boss. The week's omens hold throughout. A retreat, a boss that holds, or
// surfacing by the player's press ends the descent, said in one event, and the lane stops.
import { seeded, take, type ActionContext, type ActionRules, type GameEvent, type State } from '@idle-clash/kernel';
import { HITPOINTS } from '../shared/combat/data.ts';
import { fight, type Meal } from '../shared/combat/fight.ts';
import { countWin, fightXp, spoils } from '../shared/combat/spoils.ts';
import { combatOf, fighterOf, healthAt, mealsOf, setCombat } from '../shared/combat/state.ts';
import { product } from '../shared/expeditions/data.ts';
import { bossDepth, deepBoss, deepFoe, DEEP, marksAt, omensOf, waystoneOf } from '../shared/expeditions/deep.ts';
import { DEEP_EMPTY, expeditionsOf, setExpeditions, type DeepState } from '../shared/expeditions/state.ts';
import { weekOf } from '../shared/week-time.ts';
import { skillLevel } from '../shared/skill.ts';
import { noRoom } from '../shared/storehouse.ts';
import { fightBoss, playBoss } from './boss.ts';
import { runFoes } from './route.ts';
import { hardened } from './stage.ts';

export const deepOf = (state: State): DeepState => expeditionsOf(state).deep ?? DEEP_EMPTY;
const setDeep = (state: State, deep: DeepState) => setExpeditions(state, { ...expeditionsOf(state), deep });

/** The foe of a depth: one of the Peaks' three best for the fighter, drawn from the save's seed and the depth. */
export function foeAt(state: State, depth: number, seq: number) {
  const foes = runFoes(state, 'peaks');
  if (!foes.length) return null;
  const pick = Math.floor(seeded(state.seed)('deep', seq * 4096 + depth) * foes.length);
  return foes[pick];
}

type Answer<R> = { state: State; result: R; events: GameEvent[] };
export type DeepResult = { ok: true } | { ok: false; reason: 'locked' | 'underway' | 'home' };

/** Begins a descent from the deepest waystone; the page then starts the Combat lane's `deep` action. */
export function descend(state: State): Answer<DeepResult> {
  const d = deepOf(state);
  if (skillLevel(state, HITPOINTS) < DEEP.OPENS) return { state, result: { ok: false, reason: 'locked' }, events: [] };
  if (d.run) return { state, result: { ok: false, reason: 'underway' }, events: [] };
  const out = structuredClone(state);
  const from = waystoneOf(d.deepest);
  setDeep(out, { ...d, run: { depth: from, from, was: d.deepest, marks: 0, seq: d.descents, fed: 0 } });
  return { state: out, result: { ok: true }, events: [] };
}

/** Ends the descent under way, said in one event. */
function surface(ctx: Pick<ActionContext, 'state' | 'at' | 'emit'>, outcome: 'retreated' | 'lost' | 'surfaced') {
  const d = deepOf(ctx.state);
  if (!d.run) return;
  setDeep(ctx.state, { ...d, descents: d.descents + 1, run: null });
  ctx.emit({
    type: 'deepDone',
    at: ctx.at,
    depth: d.run.depth,
    from: d.run.from,
    deepest: d.deepest,
    record: d.run.depth > d.run.was,
    marks: d.run.marks,
    outcome,
  });
}

/** Surfacing by the player's press: what the descent brought is kept, and the lane rests. */
export function surfaceNow(state: State, at: number): Answer<DeepResult> {
  if (!deepOf(state).run) return { state, result: { ok: false, reason: 'home' }, events: [] };
  const out = structuredClone(state);
  const events: GameEvent[] = [];
  surface({ state: out, at, emit: (e) => void events.push(e) }, 'surfaced');
  const c = out.lanes.combat.current;
  if (c?.action.feature === 'expeditions' && c.action.id === 'deep') out.lanes.combat.current = null;
  return { state: out, result: { ok: true }, events };
}

/** What is left of the descent's pack: the best meals held, up to the pack's size less those eaten. */
export function packOf(state: State, fed: number): Meal[] {
  let left = Math.max(0, DEEP.PACK - fed);
  return mealsOf(state).flatMap((m) => {
    const count = Math.min(m.count, left);
    left -= count;
    return count > 0 ? [{ ...m, count }] : [];
  });
}

/** Ten minutes of fights at a depth: whether the fighter held, and the meals eaten. */
function playDepth(ctx: ActionContext, depth: number, seq: number, fed: number) {
  const { state } = ctx;
  const base = foeAt(state, depth, seq);
  if (!base) return { end: 'retreated' as const, eaten: 0 };
  const mods = omensOf(weekOf(ctx.at));
  const foe = hardened(deepFoe(base, depth), mods);
  const r = seeded(ctx.seed ?? 0);
  let i = 0;
  const rng = () => r('deep', i++);
  let health = healthAt(state, ctx.startedAt);
  let [t, eaten] = [0, 0];
  let end: 'cleared' | 'retreated' = 'cleared';
  while (t < DEEP.STAGE_MINUTES * 60) {
    const p = fighterOf(state, foe);
    if (!p) break;
    const pack = packOf(state, fed + eaten);
    const f = fight(p, foe, rng, health, pack, { hit: product(mods, 'hit'), heal: product(mods, 'heal') });
    for (const [item, n] of Object.entries(f.eaten)) {
      take(state, item, n);
      eaten += n;
    }
    if (p.supply) take(state, p.supply.item, 1);
    fightXp(ctx, p, foe, f.dealt, product(mods, 'xp'));
    t += f.seconds;
    health = f.health;
    if (f.retreated) {
      end = 'retreated';
      break;
    }
    spoils(ctx, p, foe, { drops: product(mods, 'drops'), finds: product(mods, 'finds'), gold: 1 });
    countWin(ctx, base.id);
  }
  setCombat(state, { ...combatOf(state), health, healthAt: ctx.at, retreated: null });
  return { end, eaten };
}

export const DEEP_RULES: ActionRules = {
  lane: 'combat',
  seeded: true,
  check: (ctx) => {
    if (skillLevel(ctx.state, HITPOINTS) < DEEP.OPENS)
      return { code: 'hitpointsTooLow', detail: { level: DEEP.OPENS } };
    const run = deepOf(ctx.state).run;
    if (!run) return { code: 'deepHome' };
    const depth = run.depth + 1;
    const foe = bossDepth(depth) ? deepBoss(depth) : foeAt(ctx.state, depth, run.seq);
    if (!foe) return { code: 'deepHome' };
    if (!fighterOf(ctx.state, foe)) return { code: 'noWeapon' };
    return noRoom(ctx.state, [foe.drop]);
  },
  duration: (ctx) => {
    const run = deepOf(ctx.state).run;
    if (!run || !bossDepth(run.depth + 1)) return DEEP.STAGE_MINUTES * 60_000;
    const fought = playBoss(ctx, deepBoss(run.depth + 1), omensOf(weekOf(ctx.at)), packOf(ctx.state, run.fed));
    return (fought?.seconds ?? 3) * 1000;
  },
  complete: (ctx) => {
    const run = deepOf(ctx.state).run;
    if (!run) return false;
    const depth = run.depth + 1;
    const mods = omensOf(weekOf(ctx.at));
    // A boss pays its marks as it falls; a depth of fights pays them here.
    let [marks, paid] = [0, 0];
    let eaten: number;
    if (bossDepth(depth)) {
      const fought = fightBoss(ctx, deepBoss(depth), mods, { meals: packOf(ctx.state, run.fed) });
      eaten = fought.eaten;
      if (!fought.won) return void surface(ctx, 'lost');
      paid = fought.marks;
    } else {
      const played = playDepth(ctx, depth, run.seq, run.fed);
      eaten = played.eaten;
      if (played.end === 'retreated') return void surface(ctx, 'retreated');
      marks = Math.round(marksAt(depth) * product(mods, 'marks'));
    }
    // Gone a depth down: the marks paid, the deepest ever and this week's kept.
    const e = expeditionsOf(ctx.state);
    const d = e.deep ?? DEEP_EMPTY;
    const week = weekOf(ctx.at);
    const weekDeepest = d.week === week ? Math.max(d.weekDeepest, depth) : depth;
    setExpeditions(ctx.state, {
      ...e,
      marks: e.marks + marks,
      deep: {
        ...d,
        deepest: Math.max(d.deepest, depth),
        week,
        weekDeepest,
        run: { ...run, depth, marks: run.marks + marks + paid, fed: run.fed + eaten },
      },
    });
  },
};
