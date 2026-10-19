// Session 0's proof: every target in the brief, worked through the paper model. Run: node design/model/checks.ts
import { FINDS, FOES, MINING, RARITY, SKILLS, SMITHING, STOREHOUSE, TIER_XP_PER_HOUR, VALUE, WOODCUTTING, beatenBy, type SkillId, type Style } from './content.ts';
import { actionRate, masteryStep, matchup, tierForLevel } from './mechanics.ts';
import { combatCandidates, combatOdds, fitLevelTimes, gatherCandidates, levelFromTable, roundTable, simulate, smithingCandidates } from './curve.ts';
import { unlockTable } from './unlocks.ts';
import { rng } from './rng.ts';

const lines: string[] = [];
const out = (s = '') => { lines.push(s); console.log(s); };
const pct = (a: number, b: number) => `${a >= b ? '+' : ''}${Math.round((a / b - 1) * 100)}%`;
let failures = 0;
const check = (ok: boolean, what: string) => { if (!ok) failures++; out(`${ok ? 'PASS' : 'FAIL'}  ${what}`); };

// 1. The curve.
const fit = fitLevelTimes();
const table = roundTable(simulate(gatherCandidates('woodcutting'), { days: 21, T: fit.T }).derived.slice(0, 41));
out('## XP table (total XP to reach each level)');
out(table.slice(1).map((x, i) => `${i + 1}: ${x.toLocaleString('en')}`).join(' · '));

out('\n## Pacing for a skill kept in a lane (one active hour with the fire each day)');
const targets: Record<number, number> = { 10: 1, 20: 24, 30: 120, 40: 504 };
const fmt = (h: number) => (h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} days`);
const runs: [string, () => number[]][] = [
  ['Woodcutting', () => simulate(gatherCandidates('woodcutting'), { days: 30, table }).reached],
  ['Mining', () => simulate(gatherCandidates('mining'), { days: 30, table }).reached],
  ['Smithing', () => simulate(smithingCandidates, { days: 30, table }).reached],
  ...(['melee', 'archery', 'magic'] as Style[]).map((s): [string, () => number[]] => [s[0].toUpperCase() + s.slice(1), () => {
    let hpXp = 0;
    return simulate(combatCandidates(s, () => levelFromTable(table, hpXp)), { days: 30, table, step: 60, onHp: (x) => (hpXp += x) }).reached;
  }]),
];
for (const [name, run] of runs) {
  const r = run();
  out(`${name.padEnd(12)} ${[10, 20, 30, 40].map((l) => `L${l} ${fmt(r[l])} (${pct(r[l], targets[l])})`).join('  ')}`);
  for (const l of [10, 20, 30, 40]) check(Math.abs(r[l] / targets[l] - 1) <= 0.25, `${name} level ${l} within 25% of target`);
}
const firstLevel = Math.ceil(table[2] / WOODCUTTING[0].xp) * WOODCUTTING[0].seconds;
check(firstLevel < 60, `First level-up after ${firstLevel} s of chopping (target under 1 minute)`);

// 2. No empty levels.
out('\n## Unlocks');
for (const s of SKILLS) {
  const t = unlockTable(s.id);
  const emptyLevels = [...t].filter(([, u]) => u.length === 0).map(([l]) => l);
  check(emptyLevels.length === 0, `${s.name}: every level 1-40 unlocks something${emptyLevels.length ? ` (empty: ${emptyLevels})` : ''}`);
}

// 3. Choices and mastery.
out('\n## Choices at each tier (XP an hour, mid-tier, against the best)');
const MASTERED = 24000;
for (const skill of ['woodcutting', 'mining'] as const) {
  const acts = skill === 'woodcutting' ? WOODCUTTING : MINING;
  for (const tier of [1, 2, 3, 4]) {
    const lvl = [5, 15, 25, 35][tier - 1];
    const rate = (a: (typeof acts)[number], done: number) => { const r = actionRate(skill, lvl, a, done, false); return (r.xpPerAction / r.secondsPerAction) * 3600; };
    const std = acts.find((a) => a.tier === tier && a.kind === 'standard')!;
    const rich = acts.find((a) => a.tier === tier && a.kind === 'rich')!;
    const opts = [`${std.name} ${Math.round(rate(std, 450))}`, `${rich.name} ${Math.round(rate(rich, 450))} (+100% materials)`];
    const ratios = [rate(rich, 450) / rate(std, 450)];
    if (tier > 1) { const old = acts.find((a) => a.tier === tier - 1 && a.kind === 'standard')!; opts.push(`${old.name} mastered ${Math.round(rate(old, MASTERED))}`); ratios.push(rate(old, MASTERED) / rate(std, 450)); }
    out(`${skill} tier ${tier}: ${opts.join(' · ')}`);
    check(ratios.filter((r) => r >= 0.8).length >= 1, `${skill} tier ${tier} offers two choices within 20%`);
  }
}
// Mastery pays: an action unlocked 10 levels below, with the mastery real play gave it (at least a day's use),
// against the best fresh action at that level.
for (const skill of ['woodcutting', 'mining'] as const) {
  const acts = skill === 'woodcutting' ? WOODCUTTING : MINING;
  const sim = simulate(gatherCandidates(skill), { days: 30, table });
  for (const old of acts.filter((a) => a.level + 10 <= 40)) {
    const lvl = old.level + 10;
    const xph = (a: (typeof acts)[number], n: number) => { const r = actionRate(skill, lvl, a, n, false); return r.xpPerAction / r.secondsPerAction; };
    const dayOfUse = 86400 / old.seconds;
    const had = Math.max(sim.doneAt[lvl]?.get(old.id) ?? 0, dayOfUse);
    const best = Math.max(...acts.filter((a) => a.level <= lvl && a.level > old.level && a.kind === old.kind).map((a) => xph(a, 0)), xph(old, 0));
    const ratio = xph(old, had) / best;
    check(ratio >= 0.8, `Mastery pays: at ${skill} ${lvl}, ${old.name} (mastery ${masteryStep(had)}) earns ${Math.round(ratio * 100)}% of the best fresh action of its kind`);
  }
}
out('Smithing: every recipe in a tier pays the same XP an hour; bars are quicker to sell, gear is worth 40% more than its bars.');
check(SMITHING.every((r) => Math.abs((r.xp / r.seconds) * 3600 / TIER_XP_PER_HOUR[r.tier - 1] - 1) < 0.1), 'Smithing recipes within 10% of their tier rate');

// 4. Combat: the triangle and the tier choices.
out('\n## The triangle (each foe at its intended level: XP an hour, food an hour, verdict)');
for (const f of FOES) {
  const lvl = Math.max(1, f.level - 1);
  const row = (['melee', 'archery', 'magic'] as Style[]).map((s) => {
    const o = combatOdds(s, lvl, f.hitpoints, f.id);
    return { s, o, mu: matchup(s, f.style) };
  });
  out(`${f.name.padEnd(15)} ${f.style.padEnd(8)} ` + row.map((r) => `${r.s} ${r.mu.slice(0, 3)} ${Math.round(r.o.xpPerHour)} xp ${r.o.foodPerHour.toFixed(0)} food ${r.o.verdict}`).join(' | '));
  const adv = row.find((r) => r.mu === 'advantage')!, dis = row.find((r) => r.mu === 'disadvantage')!;
  check(adv.o.xpPerHour > dis.o.xpPerHour && adv.o.foodPerHour < dis.o.foodPerHour, `${f.name}: ${beatenBy[f.style]} wins, ${dis.s} loses`);
}
for (const tier of [1, 2, 3, 4]) {
  const lvl = [6, 16, 26, 36][tier - 1];
  const best = (['melee', 'archery', 'magic'] as Style[]).flatMap((s) => FOES.filter((f) => f.hitpoints <= lvl).map((f) => ({ f: f.name, s, x: combatOdds(s, lvl, lvl, f.id) })))
    .filter((r) => (r.x.verdict === 'Easy' || r.x.verdict === 'Fair') && FOES.find((f) => f.name === r.f)!.tier >= tier - 1).sort((a, b) => b.x.xpPerHour - a.x.xpPerHour);
  const top = best[0], second = best[1]; // a different target or a different style both count as a choice
  out(`Combat level ${lvl}: ${top.s} vs ${top.f} ${Math.round(top.x.xpPerHour)} · ${second.s} vs ${second.f} ${Math.round(second.x.xpPerHour)}`);
  check(second.x.xpPerHour / top.x.xpPerHour >= 0.8, `Combat tier ${tier} offers two choices (style or target) within 20%`);
}

export { table, check, out, lines, fmt, failures, MASTERED };
void RARITY; void FINDS; void STOREHOUSE; void VALUE; void masteryStep; void tierForLevel; void rng;
export type { SkillId };
