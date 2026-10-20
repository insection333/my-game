// The simulation's checks: simulated players on the real engine, against the brief's targets and
// against the paper model (within 25% of both). Each built skill is checked; targets that need
// skills not yet built stay with the paper model until they are.
import { FEATURES, type Feature } from '@idle-clash/features';
import { HOUR, type GameEvent, type LaneId } from '@idle-clash/kernel';
import { readFileSync } from 'node:fs';
import { gatherCandidates, simulate, smithingCandidates } from '../../design/model/curve.ts';
import { DAY, focusedPlayer, gaps, T0, xpPerHour, type Played } from './player.ts';

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

  const awayRuns: Played[][] = [];
  let gatheringJoined = false;
  for (const [f, lane] of keptSkills()) {
    const name = f.id[0].toUpperCase() + f.id.slice(1);
    const runs: Played[] = PLAYERS.map((seed) => focusedPlayer(f, seed, DAYS, lane));
    lines.push(`\n## ${name}: ${PLAYERS.length} focused players, ${DAYS} days on the real engine`);

    // Pacing, against the brief and the paper model.
    const model = simulate(modelFor(f.id), { days: 30, table }).reached;
    for (const l of [10, 20, 30, 40]) {
      const h = median(runs.map((r) => r.levelAt[l] ?? Infinity));
      lines.push(
        `Level ${l}: ${show(h)} (target ${show(TARGETS[l])}, ${off(h, TARGETS[l])}; model ${show(model[l])}, ${off(h, model[l])})`,
      );
      check(Math.abs(h / TARGETS[l] - 1) <= 0.25, `${name} level ${l} within 25% of the target`);
      check(Math.abs(h / model[l] - 1) <= 0.25, `${name} level ${l} within 25% of the paper model`);
    }
    const first = Math.max(...runs.map((r) => r.levelAt[2] * 3600));
    check(first < 60, `${name}: first level-up after ${Math.round(first)} s at most (target under 1 minute)`);

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

    const commands = runs.reduce((n, r) => n + r.commands, 0);
    const refused = runs.reduce((n, r) => n + r.refused, 0);
    check(refused / commands <= 0.01, `${name}: ${refused} of ${commands} commands refused (at most 1%)`);
    const stuck = runs.filter((r) => r.final.lanes[lane].current === null).length;
    check(stuck === 0, `${name}: every player's lane still working on day ${DAYS}`);
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
