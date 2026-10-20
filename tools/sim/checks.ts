// The simulation's checks: simulated players on the real engine, against the brief's targets and
// against the paper model (within 25% of both). Each built skill is checked, each combat style by a
// focused fighter, and the fire's worth once four lanes run.
import { STYLES } from '@idle-clash/content';
import { FEATURES, type Feature } from '@idle-clash/features';
import { HOUR, type GameEvent, type LaneId } from '@idle-clash/kernel';
import { readFileSync } from 'node:fs';
import {
  combatCandidates,
  gatherCandidates,
  levelFromTable,
  simulate,
  smithingCandidates,
  type Candidates,
} from '../../design/model/curve.ts';
import { combatXpPerHour, fighter } from './combat.ts';
import { newcomer } from './newcomer.ts';
import { combatProofs } from './proofs.ts';
import { bestAction, DAY, focusedPlayer, gaps, T0, xpPerHour, type Played } from './player.ts';

export interface SimResult {
  lines: string[];
  passed: number;
  failed: string[];
}

const PLAYERS = [11, 23, 37];
const DAYS = 28;
/** Hours to each level for a skill kept in a lane (the brief's pacing targets). */
const TARGETS: Record<number, number> = { 10: 1, 20: 24, 30: 120, 40: 504 };
const STAGES: [string, number][] = [
  ['First hour', 0],
  ['Day 2', 1],
  ['Day 5', 4],
  ['Day 14', 13],
  ['Day 21', 20],
];

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const show = (h: number) =>
  h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} days`;
const off = (a: number, b: number) => `${a >= b ? '+' : ''}${Math.round((a / b - 1) * 100)}%`;

/** Skills built and switched on whose actions all run in one Gathering or Artisan lane. */
const keptSkills = (): [Feature, LaneId][] =>
  FEATURES.flatMap((f): [Feature, LaneId][] => {
    const kinds = new Set(Object.values(f.rules).map((r) => r.lane));
    const [kind] = kinds;
    if (!f.flag.on || !f.content.skill || kinds.size !== 1 || kind === 'combat') return [];
    return [[f, kind]];
  });

/** The paper model's focused player for the same skill. */
const modelFor = (id: string) =>
  id === 'smithing' ? smithingCandidates : gatherCandidates(id as 'woodcutting' | 'mining');

/** The paper model's focused fighter, its Hitpoints rising with it. */
function modelFighter(style: (typeof STYLES)[number], table: number[]) {
  let hpXp = 0;
  const cands: Candidates = combatCandidates(style, () => levelFromTable(table, hpXp));
  return simulate(cands, { days: 30, table, step: 60, onHp: (x) => (hpXp += x) }).reached;
}
const title = (id: string) => id[0].toUpperCase() + id.slice(1);

export function runSimulation(): SimResult {
  const lines: string[] = [];
  const failed: string[] = [];
  let passed = 0;
  const check = (ok: boolean, what: string) => {
    lines.push(`${ok ? 'PASS' : 'FAIL'}  ${what}`);
    if (ok) passed++;
    else failed.push(what);
  };
  const table = JSON.parse(
    readFileSync(new URL('../../design/model/xp-table.json', import.meta.url), 'utf8'),
  ) as number[];

  /** What every focused player is held to: pacing, moments, a find, commands taken, a lane at work. */
  const common = (name: string, runs: Played[], lane: LaneId, model: number[], firstSkill = true) => {
    for (const l of [10, 20, 30, 40]) {
      const h = median(runs.map((r) => r.levelAt[l] ?? Infinity));
      lines.push(
        `Level ${l}: ${show(h)} (target ${show(TARGETS[l])}, ${off(h, TARGETS[l])}; model ${show(model[l])}, ${off(h, model[l])})`,
      );
      check(Math.abs(h / TARGETS[l] - 1) <= 0.25, `${name} level ${l} within 25% of the target`);
      check(Math.abs(h / model[l] - 1) <= 0.25, `${name} level ${l} within 25% of the paper model`);
    }
    // The brief's first level-up is a newcomer's, in the first skill they touch (a fighter's comes later).
    const first = Math.max(...runs.map((r) => r.levelAt[2] * 3600));
    if (firstSkill)
      check(first < 60, `${name}: first level-up after ${Math.round(first)} s at most (target under 1 minute)`);
    else lines.push(`First level-up after ${Math.round(first)} s at most`);

    // Notable moments in the active hour: never more than 5 minutes without one.
    for (const [stage, d] of STAGES) {
      const all = runs.map((r) => gaps(r.days[d].active, T0 + d * DAY, T0 + d * DAY + HOUR));
      const mean = median(all.map((g) => 3600 / g.length));
      const worst = Math.max(...all.flat());
      lines.push(
        `${stage}: a moment every ${(mean / 60).toFixed(1)} min on average; longest gap ${(worst / 60).toFixed(1)} min`,
      );
      check(worst <= 300, `${name}, ${stage}: never more than 5 minutes without a moment`);
    }
    const finds = (ev: GameEvent[]) => ev.some((e) => e.type === 'find');
    const lucky = runs.filter((r) => finds(r.days[0].active)).length;
    check(lucky === runs.length, `${name}: a find in the first hour for ${lucky} of ${runs.length} fresh players`);

    const commands = runs.reduce((n, r) => n + r.commands, 0);
    const refused = runs.reduce((n, r) => n + r.refused, 0);
    check(refused / commands <= 0.01, `${name}: ${refused} of ${commands} commands refused (at most 1%)`);
    const stuck = runs.filter((r) => r.final.lanes[lane].current === null).length;
    check(stuck === 0, `${name}: every player's lane still working on day ${DAYS}`);
  };

  const awayRuns: Played[][] = [];
  /** Each kept skill's (and the first style's) players, for the fire's worth on day 5. */
  const kept = new Map<string, { f?: Feature; runs: Played[] }>();
  let gatheringJoined = false;
  for (const [f, lane] of keptSkills()) {
    const name = title(f.id);
    const runs: Played[] = PLAYERS.map((seed) => focusedPlayer(f, seed, DAYS, lane));
    kept.set(f.id, { f, runs });
    lines.push(`\n## ${name}: ${PLAYERS.length} focused players, ${DAYS} days on the real engine`);
    common(name, runs, lane, simulate(modelFor(f.id), { days: 30, table }).reached);

    // Away, the fire is out: one Gathering lane, so one gathering skill joins the player below.
    if (lane !== 'gathering' || !gatheringJoined) awayRuns.push(runs);
    if (lane === 'gathering') gatheringJoined = true;

    // Mastery pays (as the model judges it): an action 10 levels behind, with the mastery real play gave
    // it (at least a day's use), against the best fresh action of its kind at that level.
    const rich = (id: string) => (f.content.actions!.find((x) => x.id === id)?.gives?.[0]?.count ?? 1) > 1;
    // (Gathering only, as in the model: Smithing's older recipes are judged by what they make.)
    for (const a of f.content.actions!.filter((x) => lane === 'gathering' && x.level + 10 <= 40)) {
      const lvl = a.level + 10;
      const r = runs[0];
      const day = r.days[Math.min(DAYS - 1, Math.floor(r.levelAt[lvl] / 24))].start;
      const key = `${f.id}:${a.id}`;
      const had = Math.max(day.mastery[key] ?? 0, Math.ceil(86400 / a.seconds!));
      const at = { ...day, skills: { ...day.skills, [f.content.skill!.id]: { xp: table[lvl] } } };
      const kin = f.content.actions!.filter((x) => rich(x.id) === rich(a.id) && x.level <= lvl && x.level >= a.level);
      const best = Math.max(...kin.map((x) => xpPerHour({ ...at, mastery: {} }, f, x.id)));
      const ratio = xpPerHour({ ...at, mastery: { [key]: had } }, f, a.id) / best;
      check(
        ratio >= 0.8,
        `${name}: ${a.id} at level ${lvl} earns ${Math.round(ratio * 100)}% of the best fresh action of its kind (at least 80%)`,
      );
    }
  }

  // Combat: a focused fighter for each style, in the Combat lane (the first one also works while away).
  if (FEATURES.some((f) => f.id === 'combat' && f.flag.on))
    for (const style of STYLES) {
      const name = title(style);
      const runs = PLAYERS.map((seed) => fighter(style, seed, DAYS));
      lines.push(`\n## ${name}: ${PLAYERS.length} focused fighters, ${DAYS} days on the real engine`);
      common(name, runs, 'combat', modelFighter(style, table), false);
      if (!kept.has('combat')) {
        kept.set('combat', { runs });
        awayRuns.push(runs);
      }
    }

  combatProofs(check, lines);

  // A newcomer following First steps: the first crafted gear worn within 15 minutes (the brief).
  if (FEATURES.some((f) => f.id === 'combat' && f.flag.on)) {
    const fresh = PLAYERS.map((seed) => newcomer(seed));
    const worn = Math.max(...fresh.map((n) => n.worn));
    const fought = Math.max(...fresh.map((n) => n.fought));
    lines.push(`\n## First steps: ${PLAYERS.length} newcomers pressing each step's button`);
    lines.push(`The sword worn after ${Math.round(worn)} s; the first hollow rat beaten after ${Math.round(fought)} s`);
    check(
      worn <= 15 * 60,
      `The first crafted gear is worn after ${Math.round(worn)} s at most (target under 15 minutes)`,
    );
    const claimed = Math.min(...fresh.map((n) => n.claimed));
    check(claimed === 6, `Every newcomer claims all six first steps within 30 minutes (${claimed} at least)`);
  }

  // The fire (as the model measures it, on day 5): an hour with it, every lane at its best action with
  // the fire's XP and the second Gathering lane, against an hour away with the lanes that run then.
  const day5 = (id: string) => kept.get(id)?.runs[0].days[4].start;
  const rate = (id: string, fire: boolean) => {
    const k = kept.get(id);
    const s = day5(id);
    if (!k || !s) return 0;
    return k.f ? xpPerHour(s, k.f, bestAction(s, k.f), fire) : combatXpPerHour(s, fire);
  };
  if (['woodcutting', 'mining', 'smithing', 'combat'].every((id) => kept.has(id))) {
    const lit = ['woodcutting', 'mining', 'smithing', 'combat'].reduce((n, id) => n + rate(id, true), 0);
    const out = ['woodcutting', 'smithing', 'combat'].reduce((n, id) => n + rate(id, false), 0);
    lines.push(`\n## The fire, day 5: ${(lit / out).toFixed(2)}x the XP of an hour away`);
    check(
      Math.abs(lit / out / 1.5 - 1) <= 0.25,
      `An hour with the fire earns ${(lit / out).toFixed(2)}x the XP of an hour away (target 1.5x)`,
    );
  }

  // The away recap belongs to a player, not a skill: a player with every lane that runs while away at
  // work (each skill kept as above) comes back after 8 hours to at least three good things.
  // Uncommon finds count as one line.
  lines.push(`\n## A player with ${awayRuns.length} lanes at work, 8 hours away`);
  for (const [stage, d] of STAGES.slice(1)) {
    const good = PLAYERS.map((_, i) => {
      const ev = awayRuns.flatMap((runs) => runs[i].days[d].away.filter((e) => e.at < T0 + d * DAY + 9 * HOUR));
      const plain = ev.filter((e) => !(e.type === 'find' && e.rarity === 'uncommon')).length;
      return plain + (ev.length > plain ? 1 : 0);
    });
    check(Math.min(...good) >= 3, `${stage}: ${Math.min(...good)} good things after 8 hours away (at least 3)`);
  }
  return { lines, passed, failed };
}
