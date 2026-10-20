// GAME_DESIGN.md's generated tables, from the model's data (used by build-docs.ts).
// Text comes from numbers through one formatter, as the real effect formatter registry will do.
import {
  FINDS,
  FOES,
  FOODS,
  MASTERY_STEPS,
  MASTERY_PER_STEP,
  MINING,
  SKILLS,
  SMITHING,
  STOREHOUSE,
  VALUE,
  WOODCUTTING,
} from './content.ts';
import { unlockTable, type Effect, type Unlock } from './unlocks.ts';
import { maxHealth, XP_PER_DAMAGE_BY_TIER } from './mechanics.ts';
import { fitLevelTimes, gatherCandidates, roundTable, simulate } from './curve.ts';

export function formatEffect(e: Effect): string {
  switch (e.kind) {
    case 'speed':
      return `${e.pct}% faster`;
    case 'extraYield':
      return `+${e.pct}% chance of an extra item`;
    case 'findChance':
      return `Rare and Legendary finds ${e.pct}% likelier`;
    case 'masteryGain':
      return `mastery ${e.pct}% faster`;
    case 'saveInput':
      return `${e.pct}% chance to save an ingredient`;
    case 'damage':
      return `+${e.pct}% damage`;
    case 'accuracy':
      return `+${e.pct}% to hit`;
    case 'guard':
      return `${e.pct}% less damage taken`;
    case 'spoils':
      return `+${e.pct}% gold and drops`;
    case 'maxHealth':
      return `+${e.amount * 10} health`;
    case 'regen':
      return `health returns ${e.pct}% faster`;
    case 'foodHeal':
      return `food heals ${e.pct}% more`;
    case 'retreatAt':
      return `retreat at ${e.pct}% health instead of 20%`;
  }
}
const fmtUnlock = (u: Unlock) =>
  u.type === 'perk' ? `${u.name} (${formatEffect(u.effect)})` : u.type === 'foe' ? `Foe: ${u.name}` : u.name;
const n = (x: number) => x.toLocaleString('en');
const p: string[] = [];
const say = (s = '') => p.push(s);

const fit = fitLevelTimes();
const table = roundTable(simulate(gatherCandidates('woodcutting'), { days: 21, T: fit.T }).derived.slice(0, 41));
say('| Level | XP | Level | XP | Level | XP | Level | XP |');
say('| --- | --- | --- | --- | --- | --- | --- | --- |');
for (let r = 1; r <= 10; r++) say(`| ${[r, r + 10, r + 20, r + 30].map((l) => `${l} | ${n(table[l])}`).join(' | ')} |`);
const XP_TABLE = p.splice(0).join('\n');

for (const s of SKILLS) {
  const t = unlockTable(s.id);
  say(`### ${s.name}`);
  say();
  say('| Levels 1–10 | Levels 11–20 | Levels 21–30 | Levels 31–40 |');
  say('| --- | --- | --- | --- |');
  for (let r = 1; r <= 10; r++)
    say(`| ${[r, r + 10, r + 20, r + 30].map((l) => `**${l}** ${t.get(l)!.map(fmtUnlock).join('; ')}`).join(' | ')} |`);
  say();
}
const UNLOCK_TABLES = p.splice(0).join('\n');

say('| Action | Skill | Level | Seconds | XP | Gives | Sells for |');
say('| --- | --- | --- | --- | --- | --- | --- |');
for (const a of [...WOODCUTTING, ...MINING]) {
  const v = (a.skill === 'woodcutting' ? VALUE.log : VALUE.ore)[a.tier - 1];
  say(
    `| ${a.name} | ${a.skill === 'woodcutting' ? 'Woodcutting' : 'Mining'} | ${a.level} | ${a.seconds} | ${a.xp} | ${a.item} ×${a.qty} | ${v} each |`,
  );
}
const GATHER = p.splice(0).join('\n');

say('| Recipe | Level | Takes | Seconds | XP | Sells for |');
say('| --- | --- | --- | --- | --- | --- |');
for (const r of SMITHING)
  say(
    `| ${r.name} | ${r.level} | ${Object.entries(r.inputs)
      .map(([k, v]) => `${k} ×${v}`)
      .join(', ')} | ${r.seconds} | ${r.xp} | ${r.value} |`,
  );
const RECIPES = p.splice(0).join('\n');

say('| Foe | Style | Level | Opens at Hitpoints | Health | Max hit | XP a defeat (style) | Gold a defeat | Drop |');
say('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const f of FOES)
  say(
    `| ${f.name} | ${f.style[0].toUpperCase() + f.style.slice(1)} | ${f.level} | ${f.hitpoints} | ${f.hp} | ${f.maxHit} | ${f.xp} | ${f.gold} | ${f.drop} |`,
  );
const FOE_TABLE = p.splice(0).join('\n');

say('| Food | Heals | Price | Sold from Hitpoints |');
say('| --- | --- | --- | --- |');
for (const f of FOODS) say(`| ${f.name} | ${f.heals} | ${f.price} | ${f.level} |`);
const FOOD_TABLE = p.splice(0).join('\n');

say('| Skill | Uncommon (about 1 in 50) | Rare (1 in 500) | Legendary (1 in 5,000) |');
say('| --- | --- | --- | --- |');
for (const [skill, rows] of Object.entries(FINDS))
  say(
    `| ${skill[0].toUpperCase() + skill.slice(1)} | ${rows[0].join(' · ')} | ${rows[1].join(' · ')} | ${rows[2].join(' · ')} |`,
  );
const FIND_TABLE = p.splice(0).join('\n');

say('| Step | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |');
say('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
say(`| Completions | ${MASTERY_STEPS.map(n).join(' | ')} |`);
say(
  `| Faster by | ${MASTERY_STEPS.map((_, i) => `${Math.round(MASTERY_PER_STEP.speed * (i + 1) * 100)}%`).join(' | ')} |`,
);
say(
  `| Extra item chance | ${MASTERY_STEPS.map((_, i) => `${Math.round(MASTERY_PER_STEP.extraYield * (i + 1) * 100)}%`).join(' | ')} |`,
);
const MASTERY_TABLE = p.splice(0).join('\n');

const STORE = `Starts with ${STOREHOUSE.startSlots} slots; each enlargement adds ${STOREHOUSE.slotsPerEnlargement}. Costs: ${STOREHOUSE.costs.map(n).join(', ')} gold.`;
const HEALTH = `Health ${maxHealth(1)} at Hitpoints 1, ${maxHealth(40)} at 40. Style XP per point of damage by foe tier: ${XP_PER_DAMAGE_BY_TIER.join(', ')}.`;

export const TABLES: Record<string, string> = {
  XP_TABLE,
  UNLOCK_TABLES,
  GATHER,
  RECIPES,
  FOE_TABLE,
  FOOD_TABLE,
  FIND_TABLE,
  MASTERY_TABLE,
  STORE,
  HEALTH,
};
