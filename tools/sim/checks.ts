// The simulation's checks: simulated players on the real engine, against the brief's targets and
// against the paper model (within 25% of both). Each built skill is checked; targets that need
// skills not yet built stay with the paper model until they are.
import { FEATURES, type Feature } from '@idle-clash/features';
import { HOUR, type GameEvent } from '@idle-clash/kernel';
import { readFileSync } from 'node:fs';
import { gatherCandidates, simulate } from '../../design/model/curve.ts';
import { DAY, focusedPlayer, gaps, T0, xpPerHour, type Played } from './player.ts';

export interface SimResult {
  lines: string[];
  passed: number;
  failed: string[];
}

const PLAYERS = [11, 23, 37, 41, 59];
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

/** Gathering skills built and switched on: kept in the Gathering lane with no inputs. */
const gatheringSkills = (): Feature[] =>
  FEATURES.filter((f) => f.flag.on && f.content.skill && Object.values(f.rules).every((r) => r.lane === 'gathering'));

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

  for (const f of gatheringSkills()) {
    const name = f.id[0].toUpperCase() + f.id.slice(1);
    const runs: Played[] = PLAYERS.map((seed) => focusedPlayer(f, seed, DAYS));
    lines.push(`\n## ${name}: ${PLAYERS.length} focused players, ${DAYS} days on the real engine`);

    // Pacing, against the brief and the paper model.
    const model = simulate(gatherCandidates(f.id as 'woodcutting' | 'mining'), { days: 30, table }).reached;
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

    // After 8 hours away, at least three good things to report (Uncommon finds count as one line).
    for (const [stage, d] of STAGES.slice(1)) {
      const worst = Math.min(
        ...runs.map((r) => {
          const from = T0 + d * DAY + HOUR;
          const ev = r.days[d].away.filter((e) => e.at < from + 8 * HOUR);
          const plain = ev.filter((e) => !(e.type === 'find' && e.rarity === 'uncommon')).length;
          return plain + (ev.length > plain ? 1 : 0);
        }),
      );
      check(worst >= 3, `${name}, ${stage}: ${worst} good things after 8 hours away (at least 3)`);
    }

    // Mastery pays (as the model judges it): an action 10 levels behind, with the mastery real play gave
    // it (at least a day's use), against the best fresh action of its kind at that level.
    const rich = (id: string) => id.startsWith('old-');
    for (const a of f.content.actions!.filter((x) => x.level + 10 <= 40)) {
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
    const stuck = runs.filter((r) => r.final.lanes.gathering.current === null).length;
    check(stuck === 0, `${name}: every player's lane still working on day ${DAYS}`);
  }
  return { lines, passed, failed };
}
