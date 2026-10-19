// Rates and the fight engine for the paper model.
import { FOODS, FOES, MASTERY_PER_STEP, MASTERY_STEPS, TIERS, type Foe, type SkillId, type Style } from './content.ts';
import { perkTotal } from './unlocks.ts';

export const masteryStep = (completions: number) => MASTERY_STEPS.filter((c) => completions >= c).length;

export interface Rate { secondsPerAction: number; xpPerAction: number; itemsPerAction: number; findMult: number }

export function actionRate(
  skill: SkillId, level: number, a: { seconds: number; xp: number; qty?: number; findMult?: number }, completions: number, fire: boolean,
): Rate {
  const m = masteryStep(completions);
  const speed = 1 + perkTotal(skill, level, 'speed') / 100 + MASTERY_PER_STEP.speed * m;
  const yieldMult = 1 + perkTotal(skill, level, 'extraYield') / 100 + MASTERY_PER_STEP.extraYield * m;
  const find = (a.findMult ?? 1) * (1 + perkTotal(skill, level, 'findChance') / 100 + MASTERY_PER_STEP.findChance * m);
  return {
    secondsPerAction: a.seconds / speed,
    xpPerAction: a.xp * (fire ? 1.15 : 1),
    itemsPerAction: (a.qty ?? 1) * yieldMult,
    findMult: find,
  };
}

// ---- Combat ----
// Style XP per point of damage dealt (overkill counts for nothing); higher-tier foes pay more per point,
// so an outlevelled foe is never the best target for long.
export const XP_PER_DAMAGE_BY_TIER = [0.30, 0.32, 0.34, 0.35];
export const HP_XP_SHARE = 0.4;
// Foes more than five levels below you teach less: 4% less per level, down to 40%.
export const easyFoeXp = (you: number, foe: number) => Math.min(1, Math.max(0.4, 1 - 0.04 * (you - foe - 5))); // Hitpoints XP per kill, as a share of the style XP
const beats: Record<Style, Style> = { melee: 'archery', archery: 'magic', magic: 'melee' };
export const matchup = (you: Style, foe: Style) => (beats[you] === foe ? 'advantage' : beats[foe] === you ? 'disadvantage' : 'even');

export interface Fighter {
  style: Style; styleLevel: number; weaponTier: number; armourTier: number; hpLevel: number;
}
export interface FightResult { seconds: number; foodUsed: number; retreated: boolean; damageTaken: number; dealt: number }

export const maxHealth = (hpLevel: number) => 300 + 40 * (hpLevel - 1);
export const tierForLevel = (level: number) => TIERS.filter((t) => t.level <= level).length;

export function fight(p: Fighter, f: Foe, rng: () => number, health: number, food: { heals: number }, mastery = 0): FightResult & { health: number } {
  const skill = p.style as SkillId;
  const mu = matchup(p.style, f.style);
  const youMult = mu === 'advantage' ? 1.25 : mu === 'disadvantage' ? 0.8 : 1;
  const foeMult = mu === 'advantage' ? 0.75 : mu === 'disadvantage' ? 1.25 : 1;
  const hit = Math.min(0.95, Math.max(0.2, 0.66 + 0.012 * (p.styleLevel - f.level) + perkTotal(skill, p.styleLevel, 'accuracy') / 100));
  const maxHit = 10 * (3 + Math.floor(p.styleLevel / 12) + p.weaponTier);
  const dmgMult = youMult * (1 + perkTotal(skill, p.styleLevel, 'damage') / 100 + MASTERY_PER_STEP.speed * mastery);
  const foeHit = Math.min(0.95, Math.max(0.2, 0.62 + 0.02 * (f.level - p.hpLevel)));
  const guard = (1 - 0.025 * 3 * p.armourTier) * (1 - perkTotal(skill, p.styleLevel, 'guard') / 100) * foeMult;
  const regenPerSec = (10 / 6) * (1 + perkTotal('hitpoints', p.hpLevel, 'regen') / 100);
  const heal = food.heals * (1 + perkTotal('hitpoints', p.hpLevel, 'foodHeal') / 100);
  const mh = maxHealth(p.hpLevel);
  let foeHp = f.hp, t = 0, foodUsed = 0, taken = 0, dealt = 0;
  while (foeHp > 0) {
    t += 3;
    if (rng() < hit) { const d = Math.min(foeHp, (1 + Math.floor(rng() * maxHit)) * dmgMult); foeHp -= d; dealt += d; }
    if (foeHp <= 0) break;
    if (rng() < foeHit) { const d = (1 + Math.floor(rng() * f.maxHit)) * guard; health -= d; taken += d; }
    health = Math.min(mh, health + regenPerSec * 3);
    if (health < mh * 0.5) { health += heal; foodUsed++; }
    if (health < mh * 0.2) return { seconds: t, foodUsed, retreated: true, damageTaken: taken, dealt, health };
  }
  t += 3; // the next foe arrives
  health = Math.min(mh, health + regenPerSec * 3);
  return { seconds: t, foodUsed, retreated: false, damageTaken: taken, dealt, health };
}

export function bestFood(hpLevel: number) {
  return [...FOODS].reverse().find((fd) => fd.level <= hpLevel)!;
}

// The "Your odds" verdict, from simulated fights.
export function odds(p: Fighter, f: Foe, rng: () => number, n = 200, mastery = 0) {
  let secs = 0, food = 0, dealt = 0, retreats = 0, health = maxHealth(p.hpLevel);
  const fd = bestFood(p.hpLevel);
  for (let i = 0; i < n; i++) { const r = fight(p, f, rng, health, fd, mastery); secs += r.seconds; food += r.foodUsed; dealt += r.dealt; if (r.retreated) { retreats++; health = maxHealth(p.hpLevel); } else health = r.health; }
  const killsPerHour = (3600 * n) / secs;
  const xpPerHour = (dealt / secs) * 3600 * XP_PER_DAMAGE_BY_TIER[f.tier - 1] * easyFoeXp(p.styleLevel, f.level);
  const foodPerHour = (food / n) * killsPerHour;
  const goldPerHour = killsPerHour * f.gold - foodPerHour * fd.price;
  const retreatRate = retreats / n;
  const verdict = retreatRate > 0.02 ? 'Too strong' : foodPerHour < 4 ? 'Easy' : foodPerHour < 25 ? 'Fair' : 'Costly';
  return { killsPerHour, xpPerHour, foodPerHour, goldPerHour, verdict, food: fd, retreatRate };
}

export const foesFor = (hitpoints: number) => FOES.filter((f) => f.hitpoints <= hitpoints);
