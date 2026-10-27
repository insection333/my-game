// Step 16's proof, on paper: no two expedition routes alike in 1,000 draws; a run of any length pays
// at least as well as the same time fighting the region's best foe in the plain lane (gold, and XP at
// what the tier's gathering pays for XP); every boss can be beaten by a fighter at its region's top in
// the style that beats it; and relics fill over months, not days.
import { beatenBy, FOES, TIER_SECONDS, TIER_XP_PER_HOUR, VALUE, type Foe, type Style } from './content.ts';
import {
  BOSSES,
  CACHE_GOLD,
  LENGTHS,
  RELIC_COSTS,
  RELICS,
  FOE_WEIGHTS,
  ROADS,
  RUN_PAY,
  SECOND_TWIST,
  STAGE_MARKS,
  STAGE_MINUTES,
  STAGES_PER_HOUR,
  TWISTS,
  type Twist,
} from './expeditions.ts';
import { bestFood, fight, maxHealth, odds, tierForLevel, type Fighter } from './mechanics.ts';
import { rng } from './rng.ts';

type Say = (s?: string) => void;
type Ok = (b: boolean, what: string) => void;
const STYLES: Style[] = ['melee', 'archery', 'magic'];
const REGIONS = [1, 2, 3];
const NAMES = ['the march', 'the Sunken Fen', 'the Ashen Peaks'];

export interface Route {
  region: number;
  hours: number;
  stages: { foe: string; after: 'cache' | 'camp' | null }[];
  twists: string[];
  roads: [string, string];
  fork: number;
}

/** The foes a run meets: the three of the region a fighter fares best against (gold and XP an hour by
 *  Your odds, none too strong while others are not), best first; for no fighter, the three strongest. */
const foesCache = new Map<string, Foe[]>();
export function runFoes(region: number, p: Fighter | null = null): Foe[] {
  const key = JSON.stringify([region, p]);
  if (!foesCache.has(key)) foesCache.set(key, rankFoes(region, p));
  return foesCache.get(key)!;
}
function rankFoes(region: number, p: Fighter | null): Foe[] {
  const open = FOES.filter((f) => f.region === region && f.hitpoints <= (p?.hpLevel ?? 99));
  if (!p) return open.slice(-3).reverse();
  const worth = (f: Foe) => {
    const o = odds(p, f, rng(p.styleLevel * 31 + f.level), 300);
    return (o.verdict === 'Too strong' ? -1e9 : 0) + o.goldPerHour + o.xpPerHour;
  };
  const w = new Map(open.map((f) => [f.id, worth(f)]));
  return [...open].sort((a, b) => w.get(b.id)! - w.get(a.id)!).slice(0, 3);
}

/** A route drawn fresh: a foe for every stage, a cache and a camp in every hour, twists and two roads. */
export function drawRoute(r: () => number, region: number, hours: number, p: Fighter | null = null): Route {
  const foes = runFoes(region, p);
  const total = FOE_WEIGHTS.slice(0, foes.length).reduce((a, b) => a + b, 0);
  const foeAt = (x: number) => {
    let left = x * total;
    return foes[FOE_WEIGHTS.findIndex((w) => (left -= w) < 0)] ?? foes[0];
  };
  const n = hours * STAGES_PER_HOUR;
  const stages = Array.from({ length: n }, () => ({
    foe: foeAt(r()).id,
    after: null as 'cache' | 'camp' | null,
  }));
  for (let h = 0; h < hours; h++) {
    const a = Math.floor(r() * STAGES_PER_HOUR);
    const b = (a + 1 + Math.floor(r() * (STAGES_PER_HOUR - 1))) % STAGES_PER_HOUR;
    stages[h * STAGES_PER_HOUR + a].after = 'cache';
    stages[h * STAGES_PER_HOUR + b].after = 'camp';
  }
  const pick = <T>(list: T[], not: T[] = []) => {
    const left = list.filter((x) => !not.includes(x));
    return left[Math.floor(r() * left.length)];
  };
  const first = pick(TWISTS);
  const twists = r() < SECOND_TWIST ? [first, pick(TWISTS, [first])] : [first];
  const a = pick(ROADS);
  return { region, hours, stages, twists: twists.map((t) => t.id), roads: [a.id, pick(ROADS, [a]).id], fork: n / 2 };
}

const byId = (list: Twist[], id: string) => list.find((t) => t.id === id)!;
const product = (mods: Twist[], key: keyof Twist) => mods.reduce((m, t) => m * ((t[key] as number) ?? 1), 1);

/** What an XP is worth in gold at a tier: what an hour of that tier's Woodcutting sells for, a XP. */
const goldPerXp = (tier: number) =>
  ((3600 / TIER_SECONDS[tier - 1]) * VALUE.log[tier - 1]) / TIER_XP_PER_HOUR[tier - 1];

/** One run, played: its worth in gold and its length in seconds, and whether the boss fell. */
export function playRoute(route: Route, p: Fighter, road: string, r: () => number) {
  const twists = route.twists.map((id) => byId(TWISTS, id));
  const stageCount = Math.round(route.stages.length * product(twists, 'stages'));
  const food = bestFood(p.hpLevel);
  const most = maxHealth(p.hpLevel);
  let [health, worth, secs, marks] = [most, 0, 0, 0];
  const gpx = goldPerXp(tierForLevel(p.styleLevel));
  for (let i = 0; i < stageCount; i++) {
    const s = route.stages[i];
    const mods = i >= route.fork ? [...twists, byId(ROADS, road)] : twists;
    const tw = { hit: product(mods, 'hit'), heal: product(mods, 'heal') };
    const foe = FOES.find((f) => f.id === s.foe)!;
    const hard = { ...foe, maxHit: Math.round(foe.maxHit * product(mods, 'foeHit')) };
    let t = 0;
    while (t < STAGE_MINUTES * 60) {
      const f = fight(p, hard, r, health, food, 0, tw);
      t += f.seconds;
      health = f.health;
      worth += f.dealt * xpPerDamage(foe) * product(mods, 'xp') * RUN_PAY * gpx - f.foodUsed * food.price;
      if (f.retreated) return { worth, secs: secs + t, won: false, marks };
      worth += foe.gold * RUN_PAY;
    }
    secs += t;
    marks += STAGE_MARKS * product(mods, 'marks');
    if (s.after === 'cache') worth += CACHE_GOLD[route.region - 1] * product(mods, 'caches');
    if (s.after === 'camp') health = Math.min(most, health + most * product(mods, 'camp'));
  }
  const mods = [...twists, byId(ROADS, road)];
  const base = BOSSES[route.region - 1];
  const boss = {
    ...base,
    hp: base.hp * product(mods, 'bossHp'),
    maxHit: Math.round(base.maxHit * product(mods, 'foeHit')),
  };
  const f = fight(p, boss, r, health, food, 0, { hit: product(mods, 'hit'), heal: product(mods, 'heal') });
  secs += f.seconds;
  worth += f.dealt * xpPerDamage(boss) * gpx - f.foodUsed * food.price;
  if (!f.retreated) {
    worth += base.gold;
    marks += base.marks * product(mods, 'marks');
  }
  return { worth, secs, won: !f.retreated, marks };
}

const XP_PER_DAMAGE = [0.3, 0.32, 0.34, 0.35, 0.34, 0.31, 0.3, 0.28];
const xpPerDamage = (f: Foe) => XP_PER_DAMAGE[f.tier - 1];

/** A fighter at the top of a region: its last foe's level, in that tier's gear. */
const fighterAt = (region: number, style: Style): Fighter => {
  const level = Math.min(99, FOES.filter((f) => f.region === region).at(-1)!.level + 2);
  return { style, styleLevel: level, weaponTier: tierForLevel(level), armourTier: tierForLevel(level), hpLevel: level };
};

/** The plain lane's best: the region foe worth the most an hour to this fighter, not too strong. */
function laneWorth(p: Fighter, region: number): number {
  const gpx = goldPerXp(tierForLevel(p.styleLevel));
  return Math.max(
    ...FOES.filter((f) => f.region === region).map((f) => {
      const o = odds(p, f, rng(p.styleLevel * 31 + f.level), 300);
      return o.verdict === 'Too strong' ? 0 : o.goldPerHour + o.xpPerHour * gpx;
    }),
  );
}

export function expeditionChecks(out: Say, ok: Ok) {
  out('\n## Expeditions and bosses (step 16)');
  for (const region of REGIONS)
    for (const hours of LENGTHS) {
      const r = rng(region * 1000 + hours);
      const p = fighterAt(region, 'melee');
      const seen = new Set(Array.from({ length: 1000 }, () => JSON.stringify(drawRoute(r, region, hours, p))));
      ok(seen.size === 1000, `${NAMES[region - 1]}, ${hours} h: 1,000 routes drawn, ${seen.size} different`);
    }
  for (const region of REGIONS) {
    for (const style of STYLES) {
      const p = fighterAt(region, style);
      const lane = laneWorth(p, region);
      const per = LENGTHS.map((hours) => {
        const r = rng(region * 7 + hours * 131 + style.length);
        let [worth, secs, wins] = [0, 0, 0];
        for (let k = 0; k < 60; k++) {
          const route = drawRoute(r, region, hours, p);
          const run = playRoute(route, p, route.roads[k % 2], r);
          worth += run.worth;
          secs += run.secs;
          wins += run.won ? 1 : 0;
        }
        return { hours, perHour: (worth / secs) * 3600, wins: wins / 60 };
      });
      out(
        `${NAMES[region - 1]}, ${style} at ${p.styleLevel}: the lane's best ${Math.round(lane)} an hour; runs ${per
          .map((x) => `${x.hours} h ${Math.round(x.perHour)} (boss ${Math.round(x.wins * 100)}%)`)
          .join(', ')}`,
      );
      for (const x of per)
        ok(x.perHour >= lane, `${NAMES[region - 1]}, ${style}, ${x.hours} h: a run pays at least the lane's best`);
    }
    const boss = BOSSES[region - 1];
    const style = beatenBy[boss.style];
    const p = fighterAt(region, style);
    const r = rng(region * 99);
    // With food, the style that beats the boss's wins; the style the boss beats, without food, mostly
    // does not: a boss is a fight to prepare for.
    const play = (q: Fighter, heals: number) => {
      let [won, eaten] = [0, 0];
      for (let k = 0; k < 200; k++) {
        const f = fight(q, boss, r, maxHealth(q.hpLevel), { heals });
        won += f.retreated ? 0 : 1;
        eaten += heals ? f.foodUsed : 0;
      }
      return { won: won / 200, eaten: eaten / 200 };
    };
    const fed = play(p, bestFood(p.hpLevel).heals);
    const weak = STYLES.find((s) => beatenBy[s] === boss.style)!;
    const bare = play(fighterAt(region, weak), 0);
    out(
      `${boss.name}: ${style} at ${p.styleLevel} with food wins ${Math.round(fed.won * 100)}% (${fed.eaten.toFixed(1)} meals a fight); ${weak} without food ${Math.round(bare.won * 100)}%`,
    );
    ok(fed.won >= 0.9, `${boss.name} falls to ${style} at the region's top, nine fights in ten`);
    ok(bare.won < 0.5, `${boss.name} beats ${weak} without food more often than not`);
  }
  // Relics: every one at full rank, for a player running the Peaks for 8 hours and its boss daily.
  const all =
    13 * RELIC_COSTS.reduce((a, b) => a + b, 0) + RELIC_COSTS.slice(0, RELICS.storeRanks).reduce((a, b) => a + b, 0);
  const daily = 8 * STAGES_PER_HOUR * STAGE_MARKS + 2 * BOSSES[2].marks;
  const days = all / daily;
  out(
    `Relics: ${all} marks for every rank of every relic; ${Math.round(daily)} marks a day at the top; ${Math.round(days)} days`,
  );
  ok(days >= 45 && days <= 120, 'Every relic at full rank takes two to four months of daily runs at the top');
}
