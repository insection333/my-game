// Session 0's proof, part two: the fire, notable events, the away recap, first finds, gold and supply.
// Run: node design/model/checks2.ts (runs part one first).
import { writeFileSync } from 'node:fs';
import {
  FOES,
  LUCK_GUARANTEE_SECONDS,
  LUCK_STEP,
  MINING,
  RARITY,
  SMITHING,
  STOREHOUSE,
  TIER_SECONDS,
  TIERS,
  VALUE,
  WOODCUTTING,
  FIRE,
  type Style,
} from './content.ts';
import { actionRate, masteryStep } from './mechanics.ts';
import {
  combatCandidates,
  combatOdds,
  gatherCandidates,
  levelFromTable,
  simulate,
  smithingCandidates,
  type Candidates,
} from './curve.ts';
import { table, check, out, lines, failures as part1Failures } from './checks.ts';
import { rng } from './rng.ts';
import { foodChecks } from './checks-food.ts';
import { forgeSupply, supplyChecks } from './checks-supply.ts';
import { expeditionChecks } from './checks-expedition.ts';
import { kindlingChecks } from './checks-kindling.ts';

let failures = part1Failures;
const ok = (b: boolean, what: string) => {
  check(b, what);
  if (!b) failures++;
};

// A player's state at a stage, from the focused simulations: levels and mastery per lane.
const STYLE: Style = 'magic';
function stageState(hours: number) {
  if (hours === 0) return { wc: 1, mi: 1, sm: 1, cb: 1, hp: 1, done: new Map<string, number>() };
  const days = hours / 24;
  const wc = simulate(gatherCandidates('woodcutting'), { days, table });
  const mi = simulate(gatherCandidates('mining'), { days, table });
  const sm = simulate(smithingCandidates, { days, table });
  let hpXp = 0;
  const cb = simulate(
    combatCandidates(STYLE, () => levelFromTable(table, hpXp)),
    { days, table, step: 60, onHp: (x) => (hpXp += x) },
  );
  const done = new Map([...wc.done, ...mi.done, ...sm.done, ...cb.done]);
  return {
    wc: levelFromTable(table, wc.xp),
    mi: levelFromTable(table, mi.xp),
    sm: levelFromTable(table, sm.xp),
    cb: levelFromTable(table, cb.xp),
    hp: levelFromTable(table, hpXp),
    done,
  };
}

type Ev = { t: number; kind: string };

// Plays `seconds` of lanes in time order and returns the notable events. `given` are goal events, which
// count as moments for the luck guarantee (active play only).
function play(
  state: ReturnType<typeof stageState>,
  laneNames: string[],
  seconds: number,
  fire: boolean,
  r: () => number,
  given: Ev[] = [],
): Ev[] {
  const events: Ev[] = [];
  const done = new Map(state.done);
  let hpXp = table[state.hp];
  let luck = 0,
    lastMoment = 0;
  const goalsLeft = [...given].sort((a, b) => a.t - b.t);
  const lanes = laneNames.map((n) => ({
    name: n,
    next: 0,
    xp: table[n === 'woodcutting' ? state.wc : n === 'mining' ? state.mi : n === 'smithing' ? state.sm : state.cb],
    cands: (): Candidates =>
      n === 'woodcutting'
        ? gatherCandidates('woodcutting')
        : n === 'mining'
          ? gatherCandidates('mining')
          : n === 'smithing'
            ? smithingCandidates
            : combatCandidates(STYLE, () => levelFromTable(table, hpXp)),
  }));
  const pick = (lane: (typeof lanes)[number]) => {
    const level = levelFromTable(table, lane.xp);
    const c = lane
      .cands()(level, done, fire)
      .reduce((a, b) => (b.xpPerSec > a.xpPerSec ? b : a));
    return { level, c, dur: c.spa * (0.85 + 0.3 * r()) };
  };
  const current = lanes.map((l) => {
    const p = pick(l);
    l.next = p.dur;
    return p;
  });
  while (true) {
    let k = 0;
    for (let i = 1; i < lanes.length; i++) if (lanes[i].next < lanes[k].next) k = i;
    const lane = lanes[k],
      { level, c } = current[k],
      t = lane.next;
    if (t > seconds) break;
    while (goalsLeft.length && goalsLeft[0].t <= t) lastMoment = goalsLeft.shift()!.t;
    const before = done.get(c.id) ?? 0;
    done.set(c.id, before + 1);
    const here: string[] = [];
    if (masteryStep(before + 1) > masteryStep(before)) here.push('mastery');
    lane.xp += c.xpPerSec * c.spa;
    if (c.hpXpPerSec) {
      const h0 = levelFromTable(table, hpXp);
      hpXp += c.hpXpPerSec * c.spa;
      if (levelFromTable(table, hpXp) > h0) here.push('level');
    }
    if (levelFromTable(table, lane.xp) > level) here.push('level');
    const act = [...WOODCUTTING, ...MINING, ...SMITHING].find((a) => a.id === c.id);
    const skill = lane.name === 'combat' ? STYLE : (lane.name as 'woodcutting');
    const fm = act ? actionRate(skill, level, act, before, fire).findMult : 1;
    const roll = r();
    if (roll < RARITY[2].chance * fm) here.push('legendary');
    else if (roll < RARITY[1].chance * fm) here.push('rare');
    else if (r() < LUCK_STEP * ++luck || (fire && t - lastMoment >= LUCK_GUARANTEE_SECONDS)) {
      here.push('uncommon');
      luck = 0;
    }
    for (const kind of here) events.push({ t, kind });
    if (here.length) lastMoment = t;
    const p = pick(lane);
    current[k] = p;
    lane.next = t + p.dur;
  }
  return events;
}

function goals(r: () => number, seconds: number, firstHour: boolean): Ev[] {
  const ev: Ev[] = [];
  if (firstHour) for (const m of [0.5, 1.5, 3, 5, 8, 12]) ev.push({ t: m * 60, kind: 'goal' });
  const startShort = firstHour ? 12 * 60 : 0;
  for (let slot = 0; slot < 3; slot++) {
    let t = startShort - slot * 60 * 4 * r();
    while ((t += (10 + 5 * r()) * 60) < seconds) ev.push({ t, kind: 'goal' });
  }
  if (!firstHour) ev.push({ t: 40 * 60, kind: 'goal' }); // the day's goal, finished during the day's session
  return ev;
}

function gaps(events: Ev[], seconds: number) {
  const moments: number[] = [];
  for (const e of events.sort((a, b) => a.t - b.t))
    if (!moments.length || e.t - moments[moments.length - 1] > 5) moments.push(e.t);
  const g: number[] = [];
  let last = 0;
  for (const m of moments) {
    g.push(m - last);
    last = m;
  }
  g.push(seconds - last);
  return { count: moments.length, mean: seconds / Math.max(1, moments.length), max: Math.max(...g) };
}

out('\n## Notable events in an hour of active play (four lanes with the fire, three short goals)');
const stages: [string, number][] = [
  ['First hour', 0],
  ['Day 2', 24],
  ['Day 5', 96],
  ['Day 14', 312],
  ['Day 21', 480],
  // The expansion's climb: the Fen (day 60) and near the top (day 100).
  ['Day 60', 1416],
  ['Day 100', 2376],
];
const states = new Map(stages.map(([n, h]) => [n, stageState(h)]));
for (const [name] of stages) {
  const st = states.get(name)!;
  let mean = 0,
    max = 0,
    worst = 0,
    finds = 0;
  const kinds: Record<string, number> = {};
  const N = 60;
  for (let i = 0; i < N; i++) {
    const r = rng(1000 + i);
    const g0 = goals(r, 3600, name === 'First hour');
    const ev = [...play(st, ['woodcutting', 'mining', 'smithing', 'combat'], 3600, true, r, g0), ...g0];
    for (const e of ev) kinds[e.kind] = (kinds[e.kind] ?? 0) + 1 / N;
    const g = gaps(ev, 3600);
    mean += g.mean / N;
    max += g.max / N;
    worst = Math.max(worst, g.max);
    if (name === 'First hour' && ev.some((e) => e.kind === 'uncommon' || e.kind === 'rare' || e.kind === 'legendary'))
      finds++;
  }
  out(
    `${name.padEnd(11)} levels W${st.wc} M${st.mi} S${st.sm} ${STYLE}${st.cb} HP${st.hp}: one moment every ${(mean / 60).toFixed(1)} min on average; longest gap ${(max / 60).toFixed(1)} min (worst of 60 runs ${(worst / 60).toFixed(1)})`,
  );
  out(
    `            per hour: ${Object.entries(kinds)
      .map(([k, v]) => `${k} ${v.toFixed(1)}`)
      .join(', ')}`,
  );
  if (name !== 'First hour') ok(Math.abs(mean / 120 - 1) <= 0.25, `${name}: a notable moment about every 2 minutes`);
  ok(worst <= 300, `${name}: never more than 5 minutes without one`);
  if (name === 'First hour')
    ok(finds / N >= 0.95, `First hour: a rare find in ${Math.round((finds / N) * 100)}% of fresh players`);
}

out('\n## The away recap after 8 hours (three lanes, no fire)');
for (const [name] of stages.slice(1)) {
  let minGood = Infinity;
  for (let i = 0; i < 40; i++) {
    const ev = play(states.get(name)!, ['woodcutting', 'smithing', 'combat'], 8 * 3600, false, rng(5000 + i));
    const good = ev.filter((e) => e.kind !== 'uncommon').length + (ev.some((e) => e.kind === 'uncommon') ? 1 : 0);
    minGood = Math.min(minGood, good);
  }
  ok(minGood >= 3, `${name}: the recap holds at least ${minGood} good things (target 3)`);
}

out('\n## The fire');
{
  const st = states.get('Day 5')!;
  const rate = (names: string[], fire: boolean) =>
    names.reduce((sum, n) => {
      const lvl = n === 'smithing' ? st.sm : n === 'combat' ? st.cb : n === 'mining' ? st.mi : st.wc;
      const c =
        n === 'smithing'
          ? smithingCandidates
          : n === 'combat'
            ? combatCandidates(STYLE, () => st.hp)
            : gatherCandidates(n as 'woodcutting');
      return sum + Math.max(...c(lvl, st.done, fire).map((x) => x.xpPerSec));
    }, 0);
  const ratio =
    rate(['woodcutting', 'mining', 'smithing', 'combat'], true) / rate(['woodcutting', 'smithing', 'combat'], false);
  ok(
    Math.abs(ratio / 1.5 - 1) <= 0.25,
    `An hour with the fire earns ${ratio.toFixed(2)}x the XP of an hour away (target 1.5x; +${FIRE.xpBonus * 100}% XP and a second Gathering lane)`,
  );
}

out('\n## First crafted gear');
{
  const oreRate = 1 / WOODCUTTING[0].seconds; // copper vein: same pace as a pine
  const bar = SMITHING.find((r) => r.id === 'smithing.bar1')!,
    sword = SMITHING.find((r) => r.id === 'smithing.sword1')!;
  const barsToLevel2 = Math.ceil(table[2] / bar.xp);
  const ores = barsToLevel2 + 3;
  const t = 30 /* tour and first steps */ + ores / oreRate + bar.seconds + sword.seconds + 10;
  ok(t < 15 * 60, `A fresh player wears a Copper sword after about ${Math.round(t / 60)} minutes (target under 15)`);
}

out('\n## Gold: does a day pay for a day of food and the next Storehouse enlargement?');
{
  // Expected purchase days for the enlargements; each costs about 70% of that day's net gold. The last
  // six came with the expansion's climb, five with Fishing and Cooking's thirty kinds of item, and six with
  // the supplies' thirty-nine.
  const buyDays = [
    1, 2, 3, 5, 7, 10, 14, 18, 25, 35, 45, 60, 75, 90, 105, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300,
  ];
  const tier = (l: number) => TIERS.filter((x) => x.level <= l).length;
  // Ores a bar takes for each ore's worth in it (copper 1; bronze's tin is cheaper; iron's two ores).
  const oreWeight = (t: number) => {
    const bar = SMITHING.find((x) => x.id === `smithing.bar${t}`)!;
    return Object.values(bar.inputs).reduce((a, b) => a + b, 0) * (t === 2 ? 1.25 / 2 : t === 4 ? 1.5 / 3 : 1);
  };
  const dayIncome = (day: number) => {
    const st = stageState(24 * (day - 1) + 12);
    const gT = tier(st.wc);
    const gather = (3600 / TIER_SECONDS[gT - 1]) * 1.2 * VALUE.log[gT - 1];
    const sT = tier(st.sm);
    const smithAdd =
      (3600 / TIER_SECONDS[sT - 1]) * Math.max(0, VALUE.bar[sT - 1] - VALUE.ore[sT - 1] * oreWeight(sT)) * 0.6;
    const best = FOES.filter((f) => f.hitpoints <= st.hp)
      .map((f) => combatOdds(STYLE, st.cb, st.hp, f.id))
      .filter((o) => o.verdict === 'Easy' || o.verdict === 'Fair')
      .sort((a, b) => b.xpPerHour - a.xpPerHour)[0];
    const combatGross = best.goldPerHour + best.foodPerHour * best.food.price;
    return { income: 24 * (gather + smithAdd + combatGross), food: 24 * best.foodPerHour * best.food.price };
  };
  const suggested: number[] = [];
  buyDays.forEach((d, i) => {
    const { income, food } = dayIncome(d);
    const cost = STOREHOUSE.costs[i];
    suggested.push(Math.round(((income - food) * 0.7) / 5000) * 5000);
    out(
      `Day ${String(d).padEnd(3)} income ${Math.round(income).toLocaleString('en')} · food ${Math.round(food).toLocaleString('en')} (${Math.round((food / income) * 100)}%) · enlargement ${i + 1} costs ${cost.toLocaleString('en')}`,
    );
    ok(income >= food + cost, `Day ${d}: a day's gold covers a day of food and enlargement ${i + 1}`);
  });
  out(`Costs at 70% of each day's net gold would be: ${suggested.join(', ')}`);
}

forgeSupply(out);
foodChecks(out, ok);
supplyChecks(out, ok);
expeditionChecks(out, ok);
kindlingChecks(out, ok, table);

writeFileSync(new URL('./report.md', import.meta.url), lines.join('\n') + '\n');
out(`\n${failures === 0 ? 'All checks pass.' : `${failures} check(s) fail.`}`);
process.exit(failures === 0 ? 0 : 1);
