// The XP curve: derived from the pacing targets, then checked by simulating focused players.
import {
  FISHING,
  FOES,
  MAX_LEVEL,
  MINING,
  RUNECRAFT,
  SMITHING,
  WOODCUTTING,
  type GatherSkill,
  type Recipe,
  type SkillId,
  type Style,
} from './content.ts';
import { FLETCHING } from './supplies.ts';
import { COOKING } from './cooking.ts';
import { actionRate, odds, tierForLevel, HP_XP_SHARE } from './mechanics.ts';
import { rng } from './rng.ts';

// Wall-clock hours at which a focused player reaches each level. Per-level time grows by a
// ratio that eases from rEarly down to 1.15 around level lMid; fitted to L10 at 1 h and L40 at 490 h.
export function levelTimes(rEarly: number, lMid: number, d1 = 30 / 3600): number[] {
  const T = [0, 0];
  let d = d1;
  for (let l = 1; l < 40; l++) {
    T.push(T[l] + d);
    d *= 1.15 + (rEarly - 1.15) / (1 + Math.exp((l - lMid) / 1.2));
  }
  return T;
}

// Past 40 (the expansion), the table is not fitted to times but continued: each level costs a little
// more XP than the one before (LATE_GROWTH), never less, so "XP to the next level" only ever rises.
// The later tiers' faster rates (TIER_XP_PER_HOUR) set how long that takes; the checks hold it to the
// year's targets (docs/EXPANSION.md).
export const LATE_GROWTH = 1.002;
/** Continues a rounded table past 40: each level's XP rounded to a thousand, so it never falls. */
export function extendTable(table40: number[]): number[] {
  const out = [...table40];
  const first = out[40] - out[39];
  for (let l = 41; l <= MAX_LEVEL; l++)
    out.push(out[l - 1] + Math.round((first * LATE_GROWTH ** (l - 40)) / 1000) * 1000);
  return out;
}
export function fitLevelTimes() {
  let best = { err: Infinity, rE: 0, lm: 0, T: [] as number[] };
  for (let rE = 1.3; rE <= 2.4; rE += 0.01)
    for (let lm = 3; lm <= 14; lm += 0.1) {
      const T = levelTimes(rE, lm);
      const err = Math.abs(Math.log(T[10])) * 3 + Math.abs(Math.log(T[40] / 490));
      if (err < best.err) best = { err, rE, lm, T };
    }
  return best;
}

export interface Candidate {
  id: string;
  xpPerSec: number;
  spa: number;
  hpXpPerSec?: number;
}
export type Candidates = (level: number, done: Map<string, number>, fire: boolean) => Candidate[];

const GATHERED = { woodcutting: WOODCUTTING, mining: MINING, fishing: FISHING, runecraft: RUNECRAFT };
export const gatherCandidates =
  (skill: GatherSkill): Candidates =>
  (level, done, fire) =>
    GATHERED[skill]
      .filter((a) => a.level <= level)
      .map((a) => {
        const r = actionRate(skill, level, a, done.get(a.id) ?? 0, fire);
        return { id: a.id, xpPerSec: r.xpPerAction / r.secondsPerAction, spa: r.secondsPerAction };
      });

export const smithingCandidates: Candidates = (level, done, fire) =>
  SMITHING.filter((r) => r.level <= level).map((r) => {
    const rt = actionRate('smithing', level, r, done.get(r.id) ?? 0, fire);
    return { id: r.id, xpPerSec: rt.xpPerAction / rt.secondsPerAction, spa: rt.secondsPerAction };
  });

/** A focused player of an artisan skill, choosing among its recipes. */
const recipeCandidates =
  (skill: SkillId, recipes: readonly Recipe[]): Candidates =>
  (level, done, fire) =>
    recipes
      .filter((r) => r.level <= level)
      .map((r) => {
        const rt = actionRate(skill, level, r, done.get(r.id) ?? 0, fire);
        return { id: r.id, xpPerSec: rt.xpPerAction / rt.secondsPerAction, spa: rt.secondsPerAction };
      });
export const cookingCandidates = recipeCandidates('cooking', COOKING);
export const fletchingCandidates = recipeCandidates('fletching', FLETCHING);

const oddsCache = new Map<string, ReturnType<typeof odds>>();
export function combatOdds(style: Style, level: number, hpLevel: number, foeId: string) {
  const key = `${style}|${level}|${hpLevel}|${foeId}`;
  if (!oddsCache.has(key)) {
    const f = FOES.find((x) => x.id === foeId)!;
    const p = { style, styleLevel: level, weaponTier: tierForLevel(level), armourTier: tierForLevel(hpLevel), hpLevel };
    oddsCache.set(key, odds(p, f, rng(level * 977 + hpLevel * 13 + f.level), 400));
  }
  return oddsCache.get(key)!;
}
// A player training one combat style, against every foe their Hitpoints level has opened.
export const combatCandidates =
  (style: Style, hpLevelOf: () => number): Candidates =>
  (level, _done, fire) =>
    FOES.filter((f) => f.hitpoints <= hpLevelOf()).map((f) => {
      const o = combatOdds(style, level, hpLevelOf(), f.id);
      const ok = o.verdict === 'Easy' || o.verdict === 'Fair'; // a sensible player avoids costly fights
      const xps = ok ? (o.xpPerHour / 3600) * (fire ? 1.15 : 1) : 0;
      return { id: f.id, xpPerSec: xps, spa: 3600 / o.killsPerHour, hpXpPerSec: xps * HP_XP_SHARE };
    });

export const levelFromTable = (table: number[], xp: number) => {
  let l = 1;
  while (l < MAX_LEVEL && xp >= table[l + 1]) l++;
  return l;
};

// A focused player: one active hour with the fire at the start of each day, then away.
// 'derive' (given T) records XP at each target time; 'verify' (given table) records when each level lands.
export function simulate(
  cands: Candidates,
  opts: { days: number; T?: number[]; table?: number[]; step?: number; onHp?: (xp: number) => void },
) {
  const doneAt: Map<string, number>[] = [];
  const step = opts.step ?? 30;
  const done = new Map<string, number>();
  let xp = 0,
    current = '';
  const derived: number[] = [0, 0];
  const reached: number[] = [0, 0];
  for (let t = 0; t < opts.days * 86400; t += step) {
    const active = (t / 3600) % 24 < 1;
    let level: number;
    if (opts.table) level = levelFromTable(opts.table, xp);
    else {
      level = 1;
      while (level < MAX_LEVEL && t / 3600 >= opts.T![level + 1]) level++;
      while (derived.length <= level) derived.push(xp);
    }
    const list = cands(level, done, active);
    if (active || !current) current = list.reduce((a, b) => (b.xpPerSec > a.xpPerSec ? b : a)).id;
    const use = list.find((c) => c.id === current)!;
    xp += use.xpPerSec * step;
    if (use.hpXpPerSec && opts.onHp) opts.onHp(use.hpXpPerSec * step);
    done.set(current, (done.get(current) ?? 0) + step / use.spa);
    if (opts.table) {
      const l2 = levelFromTable(opts.table, xp);
      while (reached.length <= l2) {
        reached.push((t + step) / 3600);
        doneAt[reached.length - 1] = new Map(done);
      }
    }
  }
  return { derived, reached, xp, done, doneAt };
}

// Rounds a table to friendly numbers: the nearest 10 below 1,000, three significant figures above.
export function roundTable(raw: number[]): number[] {
  return raw.map((x, i) => {
    if (i < 2) return 0;
    const mag = x < 1000 ? 10 : Math.pow(10, Math.floor(Math.log10(x)) - 2);
    return Math.round(x / mag) * mag;
  });
}
