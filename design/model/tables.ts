// GAME_DESIGN.md's generated tables, from the model's data (used by build-docs.ts).
// Text comes from numbers through one formatter, as the real effect formatter registry will do.
import { COOKING } from './cooking.ts';
import { FLETCHING, keyFor, SMITHING_SUPPLIES, SUPPLIES, SUPPLY_DAMAGE } from './supplies.ts';
import {
  FINDS,
  FISHING,
  FOES,
  RUNECRAFT,
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
import { unlockTable } from './unlocks.ts';
import { BOSS_FINDS, BOSSES, CACHE_GOLD, RELIC_COSTS, ROADS, TWISTS, type Twist } from './expeditions.ts';
import { MAX_LEVEL } from './content.ts';
import { fmtUnlock } from './format.ts';
import { maxHealth, XP_PER_DAMAGE_BY_TIER } from './mechanics.ts';
import { extendTable, fitLevelTimes, gatherCandidates, roundTable, simulate } from './curve.ts';

const n = (x: number) => x.toLocaleString('en');
const p: string[] = [];
const say = (s = '') => p.push(s);

const fit = fitLevelTimes();
// Levels 1 to 40 fitted to the brief's targets; past 40, continued (extendTable).
const table = extendTable(
  roundTable(simulate(gatherCandidates('woodcutting'), { days: 21, T: fit.T }).derived.slice(0, 41)),
);
say('| Level | XP | Level | XP | Level | XP | Level | XP |');
say('| --- | --- | --- | --- | --- | --- | --- | --- |');
for (let r = 1; r <= 25; r++)
  say(`| ${[r, r + 25, r + 50, r + 75].map((l) => (l <= MAX_LEVEL ? `${l} | ${n(table[l])}` : ' | ')).join(' | ')} |`);
const XP_TABLE = p.splice(0).join('\n');

for (const s of SKILLS) {
  const t = unlockTable(s.id);
  say(`### ${s.name}`);
  say();
  say('| Levels 1–25 | Levels 26–50 | Levels 51–75 | Levels 76–99 |');
  say('| --- | --- | --- | --- |');
  for (let r = 1; r <= 25; r++)
    say(
      `| ${[r, r + 25, r + 50, r + 75]
        .map((l) => (l <= MAX_LEVEL ? `**${l}** ${t.get(l)!.map(fmtUnlock).join('; ')}` : ''))
        .join(' | ')} |`,
    );
  say();
}
const UNLOCK_TABLES = p.splice(0).join('\n');

say('| Action | Skill | Level | Seconds | XP | Gives | Sells for |');
say('| --- | --- | --- | --- | --- | --- | --- |');
const GATHER_OF = {
  woodcutting: ['Woodcutting', VALUE.log],
  mining: ['Mining', VALUE.ore],
  fishing: ['Fishing', VALUE.fish],
  runecraft: ['Runecraft', VALUE.rune],
} as const;
for (const a of [...WOODCUTTING, ...MINING, ...FISHING, ...RUNECRAFT]) {
  const [skill, values] = GATHER_OF[a.skill];
  say(
    `| ${a.name} | ${skill} | ${a.level} | ${a.seconds} | ${a.xp} | ${a.item} ×${a.qty} | ${values[a.tier - 1]} each |`,
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

say('| Recipe | Skill | Level | Takes | Makes | Seconds | XP | Sells for (each) |');
say('| --- | --- | --- | --- | --- | --- | --- | --- |');
for (const [skill, list] of [
  ['Smithing', SMITHING_SUPPLIES],
  ['Fletching', FLETCHING],
] as const)
  for (const r of list)
    say(
      `| ${r.name} | ${skill} | ${r.level} | ${Object.entries(r.inputs)
        .map(([k, v]) => `${k} ×${v}`)
        .join(', ')} | ${r.makes ?? 1} | ${r.seconds} | ${r.xp} | ${r.value} |`,
    );
const SUPPLY_RECIPES = p.splice(0).join('\n');

say('| Tier | Damage | Melee | Archery | Magic | Its stones need |');
say('| --- | --- | --- | --- | --- | --- |');
for (let t = 1; t <= 8; t++) {
  const of = (style: string) => SUPPLIES.find((x) => x.tier === t && x.style === style)!;
  const cell = (style: string) => `${of(style).name} (${of(style).value} each)`;
  say(
    `| ${t} | +${SUPPLY_DAMAGE[t - 1]}% | ${cell('melee')} | ${cell('archery')} | ${cell('magic')} | ${keyFor(t) ?? 'nothing'} |`,
  );
}
const SUPPLY_TABLE = p.splice(0).join('\n');

say('| Dish | Level | Takes | Makes | Seconds | XP | Heals | Sells for | Heals per gold of worth |');
say('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const r of COOKING)
  say(
    `| ${r.name} | ${r.level} | ${Object.entries(r.inputs)
      .map(([k, v]) => `${k} ×${v}`)
      .join(
        ', ',
      )} | ${r.makes} | ${r.seconds} | ${r.xp} | ${n(r.heals)} | ${r.value} | ${(r.heals / r.value).toFixed(1)} |`,
  );
const COOKING_TABLE = p.splice(0).join('\n');

const REGIONS = ['The march', 'The Sunken Fen', 'The Ashen Peaks'];
say(
  '| Foe | Region | Style | Level | Opens at Hitpoints | Health | Max hit | XP a defeat (style) | Gold a defeat | Drop |',
);
say('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const f of FOES)
  say(
    `| ${f.name} | ${REGIONS[f.region - 1]} | ${f.style[0].toUpperCase() + f.style.slice(1)} | ${f.level} | ${f.hitpoints} | ${f.hp} | ${f.maxHit} | ${f.xp} | ${f.gold} | ${f.drop} |`,
  );
const FOE_TABLE = p.splice(0).join('\n');

say('| Food | Heals | Price | Sold from Hitpoints |');
say('| --- | --- | --- | --- |');
for (const f of FOODS) say(`| ${f.name} | ${n(f.heals)} | ${f.price} | ${f.level} |`);
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
const HEALTH = `Health ${maxHealth(1)} at Hitpoints 1, ${maxHealth(40)} at 40, ${maxHealth(MAX_LEVEL)} at ${MAX_LEVEL}. Style XP per point of damage by foe tier: ${XP_PER_DAMAGE_BY_TIER.join(', ')}.`;

// Expeditions: the bosses, and what each twist and road changes.
const BOSS_TABLE = [
  '| Boss | Region | Style | Level | Hitpoints opens | Health | Max hit | Gold | Marks | Cache worth |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...BOSSES.map(
    (b, i) =>
      `| ${b.name} | ${['The march', 'The Sunken Fen', 'The Ashen Peaks'][i]} | ${b.style} | ${b.level} | ${b.hitpoints} | ${n(b.hp)} | ${b.maxHit} | ${n(b.gold)} | ${b.marks} | ${n(CACHE_GOLD[i])} |`,
  ),
  '',
  `Each win: a Rare boss find 1 in ${Math.round(1 / BOSS_FINDS.rare)}, a Legendary 1 in ${Math.round(1 / BOSS_FINDS.legendary)}. Relic ranks cost ${RELIC_COSTS.join(', ')} marks.`,
].join('\n');
const WORDS: Record<string, (x: number) => string> = {
  hit: (x) => `hits land ${pct(x)} as often`,
  heal: (x) => `food heals ${pct(x)}`,
  foeHit: (x) => `foes hit ${pct(x)} as hard`,
  stages: (x) => `${pct(x)} of the fight stages`,
  finds: (x) => `finds ${x} times as likely`,
  drops: (x) => `drops ×${x}`,
  caches: (x) => `caches ×${x}`,
  marks: (x) => `marks ×${x}`,
  bossHp: (x) => `the boss's health ×${x}`,
  camp: (x) => `camps heal ${pct(x)}`,
  xp: (x) => `XP ×${x}`,
};
const pct = (x: number) => `${Math.round(x * 100)}%`;
const twistRow = (t: Twist) =>
  `| ${t.id} | ${Object.entries(t)
    .filter(([k]) => k !== 'id')
    .map(([k, v]) => WORDS[k](v as number))
    .join('; ')} |`;
const TWIST_TABLE = [
  '| Twist | Changes |',
  '| --- | --- |',
  ...TWISTS.map(twistRow),
  '',
  '| Road at the fork | Changes the second half |',
  '| --- | --- |',
  ...ROADS.map(twistRow),
].join('\n');

/** The XP table (index = level), for the content check to compare against packages/content. */
export const XP_TABLE_FROM_MODEL = table;

export const TABLES: Record<string, string> = {
  XP_TABLE,
  UNLOCK_TABLES,
  GATHER,
  RECIPES,
  COOKING_TABLE,
  SUPPLY_RECIPES,
  SUPPLY_TABLE,
  FOE_TABLE,
  FOOD_TABLE,
  BOSS_TABLE,
  TWIST_TABLE,
  FIND_TABLE,
  MASTERY_TABLE,
  STORE,
  HEALTH,
};
