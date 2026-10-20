// The unlock ladder: what every level 1-40 of every skill gives.
import { FOES, FOODS, MINING, SMITHING, TIERS, WOODCUTTING, type SkillId } from './content.ts';

export type Effect =
  | { kind: 'speed'; pct: number }
  | { kind: 'extraYield'; pct: number }
  | { kind: 'findChance'; pct: number }
  | { kind: 'masteryGain'; pct: number }
  | { kind: 'saveInput'; pct: number }
  | { kind: 'damage'; pct: number }
  | { kind: 'accuracy'; pct: number }
  | { kind: 'guard'; pct: number }
  | { kind: 'spoils'; pct: number }
  | { kind: 'maxHealth'; amount: number }
  | { kind: 'regen'; pct: number }
  | { kind: 'foodHeal'; pct: number }
  | { kind: 'retreatAt'; pct: number };

export type Unlock =
  | { type: 'action'; name: string }
  | { type: 'recipe'; name: string }
  | { type: 'tier'; name: string }
  | { type: 'foe'; name: string }
  | { type: 'perk'; name: string; effect: Effect };

interface PerkLine {
  name: string;
  effect: (rank: number) => Effect;
}
const roman = (n: number) => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n - 1];

function fillPerks(table: Map<number, Unlock[]>, lines: PerkLine[], capstone?: Unlock) {
  const ranks = lines.map(() => 0);
  let next = 0;
  for (let lvl = 2; lvl <= 40; lvl++) {
    if (lvl === 40 && capstone) {
      table.get(40)!.push(capstone);
      continue;
    }
    if (table.get(lvl)!.length) continue;
    const i = next++ % lines.length;
    ranks[i]++;
    table
      .get(lvl)!
      .push({ type: 'perk', name: `${lines[i].name} ${roman(ranks[i])}`, effect: lines[i].effect(ranks[i]) });
  }
}
const empty = () => new Map(Array.from({ length: 40 }, (_, i) => [i + 1, [] as Unlock[]]));

const gatherLines = (verb: string, eye: string): PerkLine[] => [
  { name: `Quick ${verb}`, effect: () => ({ kind: 'speed', pct: 2.5 }) },
  { name: 'Plenty', effect: () => ({ kind: 'extraYield', pct: 3 }) },
  { name: eye, effect: () => ({ kind: 'findChance', pct: 8 }) },
  { name: 'Practised hands', effect: () => ({ kind: 'masteryGain', pct: 6 }) },
];

export function unlockTable(skill: SkillId): Map<number, Unlock[]> {
  const t = empty();
  if (skill === 'woodcutting' || skill === 'mining') {
    const actions = skill === 'woodcutting' ? WOODCUTTING : MINING;
    for (const a of actions) t.get(a.level)!.push({ type: 'action', name: a.name });
    const [verb, eye] = skill === 'woodcutting' ? ['swing', "Woodsman's eye"] : ['strike', "Prospector's eye"];
    fillPerks(t, gatherLines(verb, eye), {
      type: 'perk',
      name: `Master ${skill === 'woodcutting' ? 'woodcutter' : 'miner'}`,
      effect: { kind: 'extraYield', pct: 10 },
    });
  } else if (skill === 'smithing') {
    for (const r of SMITHING) t.get(r.level)!.push({ type: 'recipe', name: r.name });
    fillPerks(
      t,
      [
        { name: 'Steady forge', effect: () => ({ kind: 'speed', pct: 3 }) },
        { name: 'Thrifty', effect: () => ({ kind: 'saveInput', pct: 4 }) },
        { name: "Smith's eye", effect: () => ({ kind: 'findChance', pct: 8 }) },
        { name: 'Practised hands', effect: () => ({ kind: 'masteryGain', pct: 8 }) },
      ],
      { type: 'perk', name: 'Master smith', effect: { kind: 'saveInput', pct: 8 } },
    );
  } else if (skill === 'hitpoints') {
    for (const tier of TIERS) t.get(tier.level)!.push({ type: 'tier', name: `Wear ${tier.metal} armour` });
    for (const f of FOES) t.get(f.hitpoints)!.push({ type: 'foe', name: f.name });
    for (const fd of FOODS.slice(1)) t.get(fd.level)!.push({ type: 'action', name: `The vendor sells ${fd.name}` });
    const named: Record<number, Unlock> = {
      5: { type: 'perk', name: 'Second wind', effect: { kind: 'regen', pct: 25 } },
      15: { type: 'perk', name: 'Iron stomach', effect: { kind: 'foodHeal', pct: 15 } },
      25: { type: 'perk', name: 'Field dressing', effect: { kind: 'regen', pct: 25 } },
      35: { type: 'perk', name: 'Stubborn', effect: { kind: 'retreatAt', pct: 12 } },
      40: { type: 'perk', name: 'Unbowed', effect: { kind: 'foodHeal', pct: 15 } },
    };
    for (let lvl = 1; lvl <= 40; lvl++) {
      if (named[lvl]) t.get(lvl)!.push(named[lvl]);
      if (lvl > 1) t.get(lvl)!.push({ type: 'perk', name: 'Toughness', effect: { kind: 'maxHealth', amount: 4 } });
    }
  } else {
    const weapons = { melee: 'swords', archery: 'bows', magic: 'staves' }[skill];
    for (const tier of TIERS) t.get(tier.level)!.push({ type: 'tier', name: `Wield ${tier.metal} ${weapons}` });
    const names = {
      melee: ['Heavy blows', 'Sure strike', 'Parry', 'Spoils of war'],
      archery: ['Drawn deep', 'Steady aim', 'Light step', 'Spoils of the hunt'],
      magic: ['Kindled will', 'Focus', 'Ward', 'Spoils of the wild'],
    }[skill];
    fillPerks(
      t,
      [
        { name: names[0], effect: () => ({ kind: 'damage', pct: 3 }) },
        { name: names[1], effect: () => ({ kind: 'accuracy', pct: 2 }) },
        { name: names[2], effect: () => ({ kind: 'guard', pct: 2.5 }) },
        { name: names[3], effect: () => ({ kind: 'spoils', pct: 6 }) },
      ],
      { type: 'perk', name: `Master of ${skill}`, effect: { kind: 'damage', pct: 8 } },
    );
  }
  return t;
}

// Sums a perk kind up to a level, e.g. total speed from perks at Woodcutting 25.
const tables = new Map<SkillId, Map<number, Unlock[]>>();
const totals = new Map<string, number>();
export function perkTotal(skill: SkillId, level: number, kind: Effect['kind']): number {
  const key = `${skill}|${level}|${kind}`;
  const hit = totals.get(key);
  if (hit !== undefined) return hit;
  if (!tables.has(skill)) tables.set(skill, unlockTable(skill));
  let sum = 0;
  for (const [lvl, list] of tables.get(skill)!) {
    if (lvl > level) continue;
    for (const u of list)
      if (u.type === 'perk' && u.effect.kind === kind) sum += 'pct' in u.effect ? u.effect.pct : u.effect.amount;
  }
  totals.set(key, sum);
  return sum;
}
