// Expeditions' lane rules. A run (`expeditions:march`) repeats once a stage: each fight stage takes
// ten minutes, then the boss's fight as long as it plays; when the boss falls or wins, or the fighter
// retreats, the run comes home with its story, and the lane stops. A boss (`expeditions:troll-chief`)
// can also be fought alone once a day.
import type { ActionContext, ActionRules, GameEvent, StopReason } from '@idle-clash/kernel';
import { maxHealth, retreatShare } from '../shared/combat/fight.ts';
import { fighterOf, healthAt, mealsOf } from '../shared/combat/state.ts';
import { foeById, HITPOINTS, type Foe } from '../shared/combat/data.ts';
import { BOSSES, bossIn, REGIONS, STAGE_MINUTES, type Boss, type Region } from '../shared/expeditions/data.ts';
import { expeditionsOf, setExpeditions, type Run } from '../shared/expeditions/state.ts';
import { skillLevel } from '../shared/skill.ts';
import { noRoom } from '../shared/storehouse.ts';
import { dayOf, fightBoss, playBoss, restedToday } from './boss.ts';
import { cacheAt, modsAt, playStage, stageCount } from './stage.ts';

/** Why a fighter cannot take on a foe now: no weapon, or hurt with nothing to eat. */
function unfit(ctx: ActionContext, foe: Foe, gives: string[]): StopReason | null {
  const p = fighterOf(ctx.state, foe);
  if (!p) return { code: 'noWeapon' };
  const low = healthAt(ctx.state, ctx.at) < maxHealth(p) * retreatShare(p);
  if (low && mealsOf(ctx.state).length === 0) return { code: 'tooHurt' };
  return noRoom(ctx.state, gives);
}

const runOf = (ctx: ActionContext, region: Region): Run | null => {
  const run = expeditionsOf(ctx.state).run;
  return run && run.region === region ? run : null;
};

/** Brings a run home: its story as an event, a completed run counted by length when the boss fell. */
function home(ctx: ActionContext, run: Run, outcome: 'won' | 'lost' | 'retreated', finds: string[]) {
  const e = expeditionsOf(ctx.state);
  const key = String(run.hours);
  const runs = outcome === 'won' ? { ...e.runs, [key]: (Object.hasOwn(e.runs, key) ? e.runs[key] : 0) + 1 } : e.runs;
  setExpeditions(ctx.state, { ...e, run: null, runs });
  ctx.emit({
    type: 'expeditionDone',
    at: ctx.at,
    region: run.region,
    hours: run.hours,
    road: run.road,
    boss: bossIn(run.region).id,
    outcome,
    cleared: run.cleared,
    stages: stageCount(run),
    marks: run.marks,
    finds,
  });
}

/** The lane's events, with any find also kept for the run's story. */
function noting(ctx: ActionContext, finds: string[]): ActionContext {
  return {
    ...ctx,
    roll: () => ctx.roll(),
    emit: (e: GameEvent) => {
      if (e.type === 'find') finds.push(e.item);
      ctx.emit(e);
    },
  };
}

function runRules(region: Region): ActionRules {
  const boss = bossIn(region);
  return {
    lane: 'combat',
    seeded: true,
    check: (ctx) => {
      const run = runOf(ctx, region);
      if (!run) return { code: 'expeditionHome' };
      if (run.at >= stageCount(run)) return unfit(ctx, boss, [boss.drop]);
      const foe = foeById(run.stages[run.at].foe)!;
      const cache = run.stages[run.at].after === 'cache' ? cacheAt(ctx.state, run) : null;
      return unfit(ctx, foe, [foe.drop, ...(cache ? [cache.item] : [])]);
    },
    duration: (ctx) => {
      const run = runOf(ctx, region);
      if (!run || run.at < stageCount(run)) return STAGE_MINUTES * 60_000;
      return (playBoss(ctx, boss, modsAt(run, run.at))?.seconds ?? 3) * 1000;
    },
    complete: (ctx) => {
      const run = runOf(ctx, region);
      if (!run) return false;
      const finds = [...run.finds];
      const c = noting(ctx, finds);
      if (run.at < stageCount(run)) {
        const { end, marks } = playStage(c, run);
        if (end === 'retreated') return void home(c, { ...run, finds }, 'retreated', finds);
        const e = expeditionsOf(ctx.state);
        const next = { ...run, at: run.at + 1, cleared: run.cleared + 1, marks: run.marks + marks, finds };
        setExpeditions(ctx.state, { ...e, marks: e.marks + marks, run: next });
        return;
      }
      const fought = fightBoss(c, boss, modsAt(run, run.at));
      home(c, { ...run, marks: run.marks + fought.marks }, fought.won ? 'won' : 'lost', finds);
    },
  };
}

function bossRules(boss: Boss): ActionRules {
  return {
    lane: 'combat',
    seeded: true,
    check: (ctx) => {
      if (skillLevel(ctx.state, HITPOINTS) < boss.hitpoints)
        return { code: 'hitpointsTooLow', detail: { level: boss.hitpoints } };
      if (restedToday(ctx.state, boss, ctx.at)) return { code: 'bossRested' };
      return unfit(ctx, boss, [boss.drop]);
    },
    duration: (ctx) => (playBoss(ctx, boss, [])?.seconds ?? 3) * 1000,
    complete: (ctx) => {
      fightBoss(ctx, boss, []);
      const e = expeditionsOf(ctx.state);
      setExpeditions(ctx.state, { ...e, bossDay: { ...e.bossDay, [boss.id]: dayOf(ctx.at) } });
    },
  };
}

export const RULES: Record<string, ActionRules> = {
  ...Object.fromEntries(REGIONS.map((r) => [r, runRules(r)])),
  ...Object.fromEntries(BOSSES.map((b) => [b.id, bossRules(b)])),
};
