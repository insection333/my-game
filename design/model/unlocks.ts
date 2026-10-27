// The unlock ladder: what every level 1-99 of every skill gives.
import {
  FISHING,
  FOES,
  FOODS,
  MAX_LEVEL,
  MINING,
  RUNECRAFT,
  SMITHING,
  TIERS,
  WOODCUTTING,
  type SkillId,
} from './content.ts';
import { FLETCHING, SMITHING_SUPPLIES } from './supplies.ts';
import { COOKING } from './cooking.ts';

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
const ROMAN: [number, string][] = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];
export const roman = (n: number) => {
  let out = '';
  for (const [v, r] of ROMAN)
    while (n >= v) {
      out += r;
      n -= v;
    }
  return out;
};

/** After level 40 (the expansion's climb), a perk line's ranks give half: there are so many more. */
export const LATE_FROM = 41;
const half = (e: Effect): Effect => ('pct' in e ? { ...e, pct: e.pct / 2 } : { ...e, amount: e.amount / 2 });

/** Fills every level not already holding an unlock with the next perk line's next rank, in turn;
 *  the capstones (level 40 and the top) are fixed. */
function fillPerks(table: Map<number, Unlock[]>, lines: PerkLine[], capstones: Record<number, Unlock> = {}) {
  const ranks = lines.map(() => 0);
  let next = 0;
  for (let lvl = 2; lvl <= MAX_LEVEL; lvl++) {
    if (capstones[lvl]) {
      table.get(lvl)!.push(capstones[lvl]);
      continue;
    }
    if (table.get(lvl)!.length) continue;
    const i = next++ % lines.length;
    ranks[i]++;
    const effect = lines[i].effect(ranks[i]);
    table.get(lvl)!.push({
      type: 'perk',
      name: `${lines[i].name} ${roman(ranks[i])}`,
      effect: lvl >= LATE_FROM ? half(effect) : effect,
    });
  }
}
const empty = () => new Map(Array.from({ length: MAX_LEVEL }, (_, i) => [i + 1, [] as Unlock[]]));

const gatherLines = (verb: string, eye: string): PerkLine[] => [
  { name: `Quick ${verb}`, effect: () => ({ kind: 'speed', pct: 2.5 }) },
  { name: 'Plenty', effect: () => ({ kind: 'extraYield', pct: 3 }) },
  { name: eye, effect: () => ({ kind: 'findChance', pct: 8 }) },
  { name: 'Practised hands', effect: () => ({ kind: 'masteryGain', pct: 6 }) },
];

export function unlockTable(skill: SkillId): Map<number, Unlock[]> {
  const t = empty();
  if (skill === 'woodcutting' || skill === 'mining' || skill === 'fishing' || skill === 'runecraft') {
    const actions = { woodcutting: WOODCUTTING, mining: MINING, fishing: FISHING, runecraft: RUNECRAFT }[skill];
    for (const a of actions) t.get(a.level)!.push({ type: 'action', name: a.name });
    const [verb, eye, who] = {
      woodcutting: ['swing', "Woodsman's eye", 'woodcutter'],
      mining: ['strike', "Prospector's eye", 'miner'],
      fishing: ['cast', "Angler's eye", 'angler'],
      runecraft: ['draw', "Seer's eye", 'runecrafter'],
    }[skill];
    fillPerks(t, gatherLines(verb, eye), {
      40: { type: 'perk', name: `Master ${who}`, effect: { kind: 'extraYield', pct: 10 } },
      99: { type: 'perk', name: `Grandmaster ${who}`, effect: { kind: 'extraYield', pct: 15 } },
    });
  } else if (skill === 'smithing') {
    for (const r of [...SMITHING, ...SMITHING_SUPPLIES].sort((a, b) => a.level - b.level))
      t.get(r.level)!.push({ type: 'recipe', name: r.name });
    fillPerks(
      t,
      [
        { name: 'Steady forge', effect: () => ({ kind: 'speed', pct: 3 }) },
        { name: 'Thrifty', effect: () => ({ kind: 'saveInput', pct: 4 }) },
        { name: "Smith's eye", effect: () => ({ kind: 'findChance', pct: 8 }) },
        { name: 'Practised hands', effect: () => ({ kind: 'masteryGain', pct: 8 }) },
      ],
      {
        40: { type: 'perk', name: 'Master smith', effect: { kind: 'saveInput', pct: 8 } },
        99: { type: 'perk', name: 'Grandmaster smith', effect: { kind: 'saveInput', pct: 10 } },
      },
    );
  } else if (skill === 'fletching') {
    for (const r of FLETCHING) t.get(r.level)!.push({ type: 'recipe', name: r.name });
    fillPerks(
      t,
      [
        { name: 'Fine fletching', effect: () => ({ kind: 'extraYield', pct: 3 }) },
        { name: 'Thrifty', effect: () => ({ kind: 'saveInput', pct: 4 }) },
        { name: "Fletcher's eye", effect: () => ({ kind: 'findChance', pct: 8 }) },
        { name: 'Practised hands', effect: () => ({ kind: 'masteryGain', pct: 8 }) },
      ],
      {
        40: { type: 'perk', name: 'Master fletcher', effect: { kind: 'saveInput', pct: 8 } },
        99: { type: 'perk', name: 'Grandmaster fletcher', effect: { kind: 'saveInput', pct: 10 } },
      },
    );
  } else if (skill === 'cooking') {
    for (const r of COOKING) t.get(r.level)!.push({ type: 'recipe', name: r.name });
    fillPerks(
      t,
      [
        { name: 'Steady flame', effect: () => ({ kind: 'speed', pct: 3 }) },
        { name: 'Thrifty', effect: () => ({ kind: 'saveInput', pct: 4 }) },
        { name: "Cook's eye", effect: () => ({ kind: 'findChance', pct: 8 }) },
        { name: 'Practised hands', effect: () => ({ kind: 'masteryGain', pct: 8 }) },
      ],
      {
        40: { type: 'perk', name: 'Master cook', effect: { kind: 'saveInput', pct: 8 } },
        99: { type: 'perk', name: 'Grandmaster cook', effect: { kind: 'saveInput', pct: 10 } },
      },
    );
  } else if (skill === 'hitpoints') {
    for (const tier of TIERS) t.get(tier.level)!.push({ type: 'tier', name: `Wear ${tier.metal} armour` });
    for (const f of FOES) t.get(f.hitpoints)!.push({ type: 'foe', name: f.name });
    for (const fd of FOODS.slice(1)) t.get(fd.level)!.push({ type: 'action', name: `The vendor sells ${fd.name}` });
    const named: Record<number, Unlock> = {
      5: { type: 'perk', name: 'Second wind I', effect: { kind: 'regen', pct: 25 } },
      15: { type: 'perk', name: 'Iron stomach I', effect: { kind: 'foodHeal', pct: 15 } },
      25: { type: 'perk', name: 'Field dressing I', effect: { kind: 'regen', pct: 25 } },
      35: { type: 'perk', name: 'Stubborn', effect: { kind: 'retreatAt', pct: 12 } },
      40: { type: 'perk', name: 'Unbowed', effect: { kind: 'foodHeal', pct: 15 } },
      // The climb past 40: the same perks again, a rank higher and at half strength.
      45: { type: 'perk', name: 'Second wind II', effect: { kind: 'regen', pct: 12.5 } },
      55: { type: 'perk', name: 'Iron stomach II', effect: { kind: 'foodHeal', pct: 7.5 } },
      65: { type: 'perk', name: 'Field dressing II', effect: { kind: 'regen', pct: 12.5 } },
      75: { type: 'perk', name: 'Iron stomach III', effect: { kind: 'foodHeal', pct: 7.5 } },
      85: { type: 'perk', name: 'Second wind III', effect: { kind: 'regen', pct: 12.5 } },
      95: { type: 'perk', name: 'Field dressing III', effect: { kind: 'regen', pct: 12.5 } },
      99: { type: 'perk', name: 'Unbroken', effect: { kind: 'foodHeal', pct: 20 } },
    };
    for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
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
      {
        40: { type: 'perk', name: `Master of ${skill}`, effect: { kind: 'damage', pct: 8 } },
        99: { type: 'perk', name: `Grandmaster of ${skill}`, effect: { kind: 'damage', pct: 10 } },
      },
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
